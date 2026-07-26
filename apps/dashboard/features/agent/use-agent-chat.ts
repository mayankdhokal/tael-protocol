"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { runCapability } from "../agents/run-capability";
import type { AgentMessage, ProposedAction } from "./types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `m${counter}-${Date.now()}`;
}

/** Persist the conversation so context survives a reload or navigating away. */
const STORAGE_KEY = "tael-copilot-chat";

function loadMessages(): AgentMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentMessage[]) : [];
  } catch {
    return [];
  }
}

/** Trim a capability's response body for display; pretty-print if it's JSON. */
function formatBody(body: string | undefined): string {
  if (!body) return "";
  let out = body;
  try {
    out = JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    // not JSON — leave as-is
  }
  return out.length > 1200 ? `${out.slice(0, 1200)}…` : out;
}

/**
 * Owns the conversation and the copilot fetch. `send` posts the history + the
 * current page and gets back `{ reply, action }`: the reply is shown, and an
 * action (a proposed capability run) renders as a confirm card. `runAction`
 * executes a confirmed run through the normal server action, so the card's caps
 * still bound the spend, and appends the result.
 */
export function useAgentChat(endpoint: string) {
  const [messages, setMessages] = useState<AgentMessage[]>(loadMessages);
  const [streaming, setStreaming] = useState(false);
  // The route the user is on, so the copilot can answer about the current page
  // and scope its tools to their session.
  const pathname = usePathname();
  // Guards against overlapping sends (double-enter, clicking a suggestion mid-run).
  const busy = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore — private mode / quota; persistence is a nice-to-have
    }
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy.current) return;
      busy.current = true;
      setStreaming(true);

      const now = Date.now();
      const userMsg: AgentMessage = { id: nextId(), role: "user", content, createdAt: now };
      const assistantId = nextId();
      const history = [...messages, userMsg];
      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", createdAt: now },
      ]);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            pageContext: { path: pathname },
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          reply?: string;
          action?: ProposedAction | null;
          error?: string;
        } | null;
        if (!res.ok || !data) throw new Error(data?.error ?? "request failed");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.reply ?? "", action: data.action ?? undefined }
              : m,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error && error.message !== "request failed"
            ? error.message
            : "Sorry, I couldn't reach the server. Please try again.";
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: message } : m)),
        );
      } finally {
        busy.current = false;
        setStreaming(false);
      }
    },
    [endpoint, messages, pathname],
  );

  /** Run a proposed capability the user just confirmed, then append the result. */
  const runAction = useCallback(async (messageId: string, action: ProposedAction) => {
    if (busy.current) return;
    busy.current = true;
    setStreaming(true);
    // Collapse the confirm card on the proposing message.
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actionDone: true } : m)));
    const resultId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: resultId, role: "assistant", content: "Running…", createdAt: Date.now() },
    ]);

    const isGet = (action.method ?? "GET").toUpperCase() === "GET";
    try {
      const r = await runCapability({
        agentId: action.cardId,
        slug: action.slug,
        operation: action.operation,
        method: action.method,
        body: isGet ? undefined : action.params,
        query: isGet ? action.params : undefined,
      });
      const text = r.ok
        ? `Ran ${action.operationName}${Number(r.paid) > 0 ? ` · paid $${r.paid} USDC` : " · free"}.` +
          (r.borrowed ? ` Borrowed $${r.borrowed} from TrustLine.` : "") +
          `\n\n${formatBody(r.body)}`
        : `Couldn't run it: ${r.error ?? "something went wrong"}`;
      setMessages((prev) => prev.map((m) => (m.id === resultId ? { ...m, content: text } : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === resultId ? { ...m, content: "Sorry, that didn't run." } : m)),
      );
    } finally {
      busy.current = false;
      setStreaming(false);
    }
  }, []);

  /** Clear the conversation and its saved copy. */
  const clear = useCallback(() => {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore — private mode / quota
    }
  }, []);

  return { messages, streaming, send, runAction, clear };
}
