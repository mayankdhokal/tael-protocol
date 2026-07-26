"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** What we show in the little inspector tooltip while hovering a block. */
interface BlockMeta {
  tag: string;
  size: string;
  color: string;
  font: string;
}

interface Hover {
  rect: DOMRect;
  el: HTMLElement;
  meta: BlockMeta;
}

/** "rgb(255, 255, 255)" → "#FFFFFF" (best-effort; passes other formats through). */
function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return (
    "#" +
    m
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function metaFor(el: HTMLElement, rect: DOMRect): BlockMeta {
  const cs = getComputedStyle(el);
  const family = cs.fontFamily.split(",")[0]?.replace(/["']/g, "").trim() ?? "";
  return {
    tag: el.tagName.toLowerCase(),
    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
    color: rgbToHex(cs.color),
    font: `${cs.fontSize} ${family}`,
  };
}

/** Shrink a capture to a sane size (cap width, JPEG) so the attachment stays
 *  small enough to persist and to send to the model. */
function downscale(dataUrl: string, maxW = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * A full-screen "inspect and capture" overlay. While active, it highlights the
 * block under the cursor (with a tag/size/color/font tooltip, like a browser
 * inspector), and a click screenshots just that block and hands back a data URL.
 * The overlay's own chrome is pointer-events:none so `elementFromPoint` sees the
 * real page; the click is caught in the capture phase so it never activates the
 * underlying element.
 */
export function ElementPicker({
  onCapture,
  onCancel,
}: {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [hover, setHover] = useState<Hover | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Resolve the block under a point, ignoring the copilot's own UI.
  const resolve = useCallback((x: number, y: number): Hover | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el || el.closest("[data-tael-agent]")) return null;
    if (el === document.body || el === document.documentElement) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return null;
    return { el, rect, meta: metaFor(el, rect) };
  }, []);

  const capture = useCallback(
    async (el: HTMLElement) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const { toPng } = await import("html-to-image");
        const png = await toPng(el, { pixelRatio: 2, cacheBust: true });
        const shrunk = await downscale(png);
        onCapture(shrunk);
      } catch (error) {
        console.error("[picker] capture failed:", error);
        onCancel();
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [onCapture, onCancel],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (busyRef.current) return;
      setHover(resolve(e.clientX, e.clientY));
    };
    // Capture phase so we win before the underlying element's own handler.
    const onClick = (e: MouseEvent) => {
      if (busyRef.current) return;
      const target = resolve(e.clientX, e.clientY);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      void capture(target.el);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
      document.body.style.cursor = prevCursor;
    };
  }, [resolve, capture, onCancel]);

  const box = hover?.rect;
  // Prefer the tooltip above the block; drop below if there isn't room.
  const tipTop = box ? (box.top > 88 ? box.top - 80 : box.bottom + 8) : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      {/* Faint tint so it's obvious we're in pick mode. */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Hint bar. */}
      <div className="absolute inset-x-0 top-4 flex justify-center">
        <div className="rounded-full bg-[#14161a] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-lg ring-1 ring-white/10">
          {busy ? "Capturing…" : "Click a block to capture · Esc to cancel"}
        </div>
      </div>

      {/* Highlight box + inspector tooltip. */}
      {box && !busy ? (
        <>
          <div
            className="absolute rounded-[3px] bg-sky-400/10 ring-2 ring-sky-400"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          />
          <div
            className="absolute min-w-[180px] rounded-lg bg-[#14161a] px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-white/90 shadow-lg ring-1 ring-white/10"
            style={{ left: Math.max(8, box.left), top: tipTop }}
          >
            <Row label={hover!.meta.tag} value={hover!.meta.size} />
            <Row label="color" value={hover!.meta.color} />
            <Row label="font" value={hover!.meta.font} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-white/40">{label}</span>
      <span className="max-w-[220px] truncate">{value}</span>
    </div>
  );
}
