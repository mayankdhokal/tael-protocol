"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { AgentMessage, ProposedAction } from "./types";
import { DiscordIcon } from "./icons";

/** The confirm card for a proposed action; the label + button follow its kind. */
function ActionCard({ action, onRun }: { action: ProposedAction; onRun: () => void }) {
  let label: string;
  let title: ReactNode;
  let sub: ReactNode = null;
  let button: string;
  if (action.kind === "run") {
    label = "Run capability";
    title = (
      <>
        {action.operationName} <span className="text-white/50">· {action.capabilityName}</span>
      </>
    );
    sub = (
      <>
        Pays from your <span className="text-white/70">{action.cardName}</span> card
      </>
    );
    button = Number(action.price) > 0 ? `Run · $${action.price} USDC` : "Run · free";
  } else if (action.kind === "create_card") {
    label = "Create card";
    title = action.name;
    sub = `Limits: $${action.maxPerCall}/call · $${action.dailyLimit}/day`;
    button = "Create card";
  } else {
    label = "Create API key";
    title = action.name;
    sub = action.cardName ? (
      <>
        Linked to your <span className="text-white/70">{action.cardName}</span> card · shown once
      </>
    ) : (
      "Shown only once — copy it right away"
    );
    button = "Create key";
  }
  return (
    <div className="w-full max-w-[85%] rounded-2xl border border-white/10 bg-[#1c1d21] p-3">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-0.5 text-[13.5px] font-medium text-zinc-100">{title}</p>
      {sub ? <p className="mt-0.5 text-[12px] text-white/50">{sub}</p> : null}
      <button
        type="button"
        onClick={onRun}
        className="mt-2.5 w-full rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-[#14161a] transition-all duration-150 ease-out hover:bg-white/90 active:scale-[0.98]"
      >
        {button}
      </button>
    </div>
  );
}

/** A one-time secret (e.g. a freshly created API key): mono value + copy button. */
function SecretBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full max-w-[85%] rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
      <p className="text-[11px] uppercase tracking-wide text-amber-300/80">
        Your key — copy it now
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1.5 font-mono text-[12px] text-zinc-100">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-md bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-white/40">You won&apos;t be able to see this again.</p>
    </div>
  );
}

/** Inline markdown: **bold**, `code`, and [label](url) links. */
function renderInline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k++} className="break-all rounded bg-white/10 px-1 py-0.5 font-mono text-[12px]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      const link = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      out.push(
        link ? (
          <a
            key={k++}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-400 underline decoration-sky-400/40 underline-offset-2 transition-colors hover:text-sky-300"
          >
            {link[1]}
          </a>
        ) : (
          tok
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/**
 * A small, tasteful markdown renderer for the assistant's replies: paragraphs,
 * bullet + numbered lists, bold, and inline code. Enough for chat, no deps.
 */
function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;

  const flush = (key: string) => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{renderInline(it)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={`o${key}`} className="list-decimal space-y-1 pl-5">
          {items}
        </ol>
      ) : (
        <ul key={`u${key}`} className="list-disc space-y-1 pl-5 marker:text-white/40">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  const flushCode = (key: string) => {
    if (code === null) return;
    blocks.push(
      <pre
        key={`c${key}`}
        className="max-h-64 overflow-auto rounded-lg bg-black/30 p-2.5 font-mono text-[11.5px] leading-relaxed"
      >
        <code>{code.join("\n")}</code>
      </pre>,
    );
    code = null;
  };

  text.split("\n").forEach((line, i) => {
    // ``` fences toggle a scrollable code block (e.g. a JSON result).
    if (line.trim().startsWith("```")) {
      if (code === null) {
        flush(`${i}`);
        code = [];
      } else {
        flushCode(`${i}`);
      }
      return;
    }
    if (code !== null) {
      code.push(line);
      return;
    }
    const bullet = line.match(/^\s*[*-]\s+(.*)/);
    const number = line.match(/^\s*\d+\.\s+(.*)/);
    if (bullet) {
      if (!list || list.ordered) flush(`${i}`);
      list ??= { ordered: false, items: [] };
      list.items.push(bullet[1]!);
      return;
    }
    if (number) {
      if (!list || !list.ordered) flush(`${i}`);
      list ??= { ordered: true, items: [] };
      list.items.push(number[1]!);
      return;
    }
    flush(`${i}`);
    if (line.trim()) blocks.push(<p key={i}>{renderInline(line)}</p>);
  });
  flush("end");
  flushCode("end");

  return <div className="space-y-2 leading-relaxed [overflow-wrap:anywhere]">{blocks}</div>;
}

/** A blinking three-dot indicator shown while the first token is in flight. */
export function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/50"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/** Short relative time for the message meta line (e.g. "Just now", "3m", "2h"). */
function relativeTime(ts?: number): string {
  if (!ts) return "Just now";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** A Discord invite link in the reply → render it as a branded button, not raw text. */
const DISCORD_RE = /(?:https?:\/\/)?discord\.(?:gg|com\/invite)\/[A-Za-z0-9-]+/i;

/**
 * One message row. No per-message avatar (the brand mark lives in the header/
 * teaser boxes only). The visitor gets a white bubble on the right; the assistant
 * gets a #2c2d31 bubble on the left, with an optional "Tael · AI Agent · time"
 * meta below the latest reply. A Discord invite in the reply renders as a button.
 */
export function MessageBubble({
  message,
  showMeta,
  onRunAction,
}: {
  message: AgentMessage;
  showMeta?: boolean;
  /** Called when the user confirms a proposed capability run. */
  onRunAction?: (messageId: string, action: ProposedAction) => void;
}) {
  const isUser = message.role === "user";
  const empty = message.content.length === 0;

  // Pull a Discord invite out of the assistant's text and show it as a button.
  const discord = isUser ? null : (message.content.match(DISCORD_RE)?.[0] ?? null);
  const text = discord
    ? message.content
        .replace(DISCORD_RE, "")
        .replace(/[\s:•-]+$/, "")
        .trim()
    : message.content;
  const showBubble = empty || text.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      {showBubble ? (
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-white text-[#14161a]"
              : "rounded-bl-sm bg-[#2c2d31] text-zinc-100"
          }`}
        >
          {empty ? (
            <TypingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Markdown text={text} />
            </motion.div>
          )}
        </div>
      ) : null}

      {discord ? (
        <a
          href={discord.startsWith("http") ? discord : `https://${discord}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-3.5 py-2 text-[13px] font-medium text-white transition-all duration-150 ease-out hover:bg-[#4752c4] active:scale-[0.98]"
        >
          <DiscordIcon className="h-4 w-4" /> Join our Discord
        </a>
      ) : null}

      {message.action && !message.actionDone ? (
        <ActionCard
          action={message.action}
          onRun={() => onRunAction?.(message.id, message.action!)}
        />
      ) : null}

      {message.secret ? <SecretBox value={message.secret} /> : null}

      {!isUser && showMeta && !empty ? (
        <span className="text-xs text-white/40">
          Tael • AI Agent • {relativeTime(message.createdAt)}
        </span>
      ) : null}
    </motion.div>
  );
}
