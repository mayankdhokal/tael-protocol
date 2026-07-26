"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Trash2, X } from "lucide-react";
import { AGENT_NAME, AGENT_TAGLINE, INTRO_MESSAGE, SUGGESTED_QUESTIONS } from "./knowledge";
import { useAgentChat } from "./use-agent-chat";
import { MessageBubble } from "./message-bubble";
import { ElementPicker } from "./element-picker";
import { ChatSmileIcon, ChevronDownIcon, CloseIcon, SendIcon, TaelLogoMark } from "./icons";
import { ensureNotifyPermission, playChime, sendBrowserNotification } from "./notify";
import type { TaelAgentProps } from "./types";

/** One-tap suggestion chip; turns solid white on hover (per the design). */
const CHIP_CLASS =
  "rounded-full border border-white/10 bg-[#2c2d31] px-3 py-1.5 text-xs text-white/90 shadow-sm transition-colors duration-150 ease-out hover:border-white hover:bg-white hover:text-[#14161a] active:scale-[0.97]";

/**
 * The Tael Agent: a floating, self-contained support widget. Drop `<TaelAgent />`
 * anywhere (it renders its own fixed launcher and panel) and it answers questions
 * about Tael from /api/agent. It only opens on click — no proactive pop-up.
 */
export function TaelAgent({
  endpoint = "/api/agent",
  name = AGENT_NAME,
  tagline = AGENT_TAGLINE,
  intro = INTRO_MESSAGE,
  suggestions = SUGGESTED_QUESTIONS,
}: TaelAgentProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  // Element-picker: capture a page block and attach it to the next message.
  const [picking, setPicking] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const { messages, streaming, send, runAction, clear } = useAgentChat(endpoint);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasStreaming = useRef(false);
  const askedPermission = useRef(false);

  // Pre-warm the gateway on mount so the first paid call in a demo isn't slow
  // from a cold start. Fire-and-forget and silent — no UI, errors ignored.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (base) void fetch(`${base}/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  // Keep the transcript pinned to the latest message as it streams in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Keyboard shortcut: Cmd/Ctrl + K toggles the copilot. (Cmd+T is the browser's
  // new-tab shortcut and can't be intercepted, so we use K.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // On open: focus the input, clear the unread dot, and ask once for permission
  // to send browser notifications (to nudge when the panel is closed).
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setUnread(0);
    if (!askedPermission.current) {
      askedPermission.current = true;
      void ensureNotifyPermission();
    }
  }, [open]);

  // When a reply finishes streaming, chime. If the panel is closed or the tab is
  // in the background, also raise the unread count and a browser notification.
  useEffect(() => {
    const finished = wasStreaming.current && !streaming;
    wasStreaming.current = streaming;
    if (!finished) return;
    void playChime();
    const away = !open || (typeof document !== "undefined" && document.hidden);
    if (away) {
      setUnread((n) => n + 1);
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content) {
        sendBrowserNotification("Tael assistant", last.content);
      }
    }
  }, [streaming, open, messages]);

  function submit(text: string) {
    if (streaming || (!text.trim() && attachments.length === 0)) return;
    void playChime();
    void send(text, attachments.length ? attachments : undefined);
    setDraft("");
    setAttachments([]);
  }

  // Enter pick mode: hide the panel so the whole page is selectable; restore it
  // (with the capture attached) when a block is picked or the user cancels.
  function startPicking() {
    setPicking(true);
    setOpen(false);
  }

  return (
    <>
      {/* Launcher */}
      <motion.button
        data-tael-agent
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close the Tael assistant" : "Open the Tael assistant"}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#14161a] shadow-lg shadow-black/25 transition-transform duration-150 ease-out active:scale-95"
        whileHover={{ scale: 1.04 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "down" : "chat"}
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 20, scale: 0.7 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {open ? <ChevronDownIcon className="h-6 w-6" /> : <ChatSmileIcon className="h-7 w-7" />}
          </motion.span>
        </AnimatePresence>
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-[#F98D8D] px-1 text-[11px] font-semibold text-white">
            {unread}
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-tael-agent
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-[60] flex h-[80vh] max-h-[720px] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[20px] bg-[#14161a] text-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.7)] sm:w-[404px]"
          >
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <TaelLogoMark className="text-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{name}</p>
                <p className="truncate text-xs text-white/50">{tagline}</p>
              </div>
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  aria-label="Clear chat"
                  title="Clear chat"
                  className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {/* Intro is always shown, above the live transcript. */}
              <MessageBubble message={{ id: "intro", role: "assistant", content: intro }} />

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((q) => (
                    <button key={q} type="button" onClick={() => submit(q)} className={CHIP_CLASS}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onRunAction={runAction}
                  showMeta={
                    i === messages.length - 1 && m.role === "assistant" && m.content.length > 0
                  }
                />
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft);
              }}
              className="p-3"
            >
              {attachments.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- user-captured data URL, dynamic size */}
                      <img
                        src={src}
                        alt="Captured page block"
                        className="h-14 w-auto max-w-[120px] rounded-lg border border-white/10 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}
                        aria-label="Remove attachment"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#14161a] text-white ring-1 ring-white/20 transition-colors hover:bg-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 focus-within:border-white/25">
                <button
                  type="button"
                  onClick={startPicking}
                  aria-label="Capture a block from the page"
                  title="Capture a block from the page"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Crosshair className="h-[18px] w-[18px]" />
                </button>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(draft);
                    }
                  }}
                  rows={1}
                  placeholder="Ask about Tael…"
                  className="max-h-28 flex-1 resize-none bg-transparent text-[13.5px] text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={(!draft.trim() && attachments.length === 0) || streaming}
                  aria-label="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#14161a] transition-all duration-150 ease-out hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10.5px] text-white/30">
                Tael assistant can make mistakes. Verify important details.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {picking ? (
        <ElementPicker
          onCapture={(url) => {
            setAttachments((a) => [...a, url]);
            setPicking(false);
            setOpen(true);
          }}
          onCancel={() => {
            setPicking(false);
            setOpen(true);
          }}
        />
      ) : null}
    </>
  );
}
