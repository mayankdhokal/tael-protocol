"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createAgent } from "../agents/actions";
import { createApiKey } from "../api-keys/actions";
import { runCapability } from "../agents/run-capability";
import type { AgentMessage, ProposedAction } from "./types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `m${counter}-${Date.now()}`;
}

/** Persist the conversation so context survives a reload or navigating away. */
const STORAGE_KEY = "tael-copilot-chat";

/** stellar.expert explorer base for the current network — for on-chain proof links. */
const STELLAR_EXPERT_TX = `https://stellar.expert/explorer/${
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "public" : "testnet"
}/tx/`;

function loadMessages(): AgentMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * The model returns an op's params as one freeform string. Coerce it to the
 * shape the op's METHOD needs — a query string for GET, a JSON body for POST —
 * so a Stellar pay works whether the model emitted `to=G…&amount=1` or
 * `{"to":"G…","amount":"1"}`. Without this, a JSON string handed to a GET op
 * lands as one junk query key and the op 400s for a missing `to`/`amount`.
 */
function paramsForMethod(raw: string | undefined, isGet: boolean): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  const looksJson = s.startsWith("{");
  if (isGet) {
    if (!looksJson) return s.replace(/^\?/, "");
    try {
      const obj = JSON.parse(s) as Record<string, unknown>;
      return new URLSearchParams(
        Object.entries(obj)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ).toString();
    } catch {
      return s;
    }
  }
  if (looksJson) return s;
  try {
    const obj: Record<string, string> = {};
    new URLSearchParams(s.replace(/^\?/, "")).forEach((v, k) => {
      obj[k] = v;
    });
    return JSON.stringify(obj);
  } catch {
    return s;
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

  /** Carry out an action the user just confirmed (run a capability, create a
   *  Card, or create an API key), then append the result. */
  const runAction = useCallback(async (messageId: string, action: ProposedAction) => {
    if (busy.current) return;
    busy.current = true;
    setStreaming(true);
    // Collapse the confirm card on the proposing message.
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actionDone: true } : m)));
    const resultId = nextId();
    const working =
      action.kind === "run"
        ? "Running…"
        : action.kind === "create_card"
          ? "Creating your card…"
          : "Creating your key…";
    setMessages((prev) => [
      ...prev,
      { id: resultId, role: "assistant", content: working, createdAt: Date.now() },
    ]);

    const patch = (fields: Partial<AgentMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === resultId ? { ...m, ...fields } : m)));

    try {
      if (action.kind === "run") {
        const isGet = (action.method ?? "GET").toUpperCase() === "GET";
        const params = paramsForMethod(action.params, isGet);
        const r = await runCapability({
          agentId: action.cardId,
          slug: action.slug,
          operation: action.operation,
          method: action.method,
          body: isGet ? undefined : params,
          query: isGet ? params : undefined,
        });
        patch({
          content: r.ok
            ? `**Ran ${action.operationName}**${Number(r.paid) > 0 ? ` · paid $${r.paid} USDC` : " · free"}` +
              (r.borrowed ? ` · borrowed $${r.borrowed} from TrustLine` : "") +
              (r.txHash ? `\n\n[View on-chain proof ↗](${STELLAR_EXPERT_TX}${r.txHash})` : "") +
              (r.body ? `\n\n\`\`\`json\n${formatBody(r.body)}\n\`\`\`` : "")
            : `Couldn't run it: ${r.error ?? "something went wrong"}`,
        });
      } else if (action.kind === "create_card") {
        const r = await createAgent({
          name: action.name,
          maxPerCall: action.maxPerCall,
          dailyLimit: action.dailyLimit,
        });
        if (r.ok) {
          const steps = r.ready
            ? "It's funded with XLM and has a USDC trustline, so it's ready to spend. To top it up, send **USDC** to its address:"
            : "To activate it:\n\n1. Send **~1.5 XLM** to the address below (covers the account reserve + a USDC trustline).\n2. Then send **USDC** to fund it." +
              (r.provisionError ? `\n\n(${r.provisionError})` : "");
          patch({ content: `Created your **${action.name}** card. ${steps}\n\n\`${r.address}\`` });
        } else {
          patch({ content: `Couldn't create the card: ${r.error}` });
        }
      } else {
        const r = await createApiKey(action.name, action.cardId ?? null);
        if (r.ok) {
          patch({
            content: `Created API key **${action.name}**${action.cardName ? ` linked to your ${action.cardName} card` : ""}. Copy it now — you won't be able to see it again.`,
            secret: r.key,
          });
        } else {
          patch({ content: `Couldn't create the key: ${r.error}` });
        }
      }
    } catch {
      patch({ content: "Sorry, that didn't complete." });
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
