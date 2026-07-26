import { DASHBOARD_SYSTEM_PROMPT } from "../../../features/agent/knowledge";
import type { ProposedAction } from "../../../features/agent/types";
import { listAgentWallets } from "../../../features/agents/queries";
import {
  getPublicCapabilityBySlug,
  listMyCapabilities,
  listPublicCapabilities,
} from "../../../features/capabilities/queries";
import { getPaymentsData } from "../../../features/payments/queries";
import { getWalletOverview } from "../../../features/wallet/queries";

// The dashboard's Tael copilot. It runs a tool loop over the same server queries
// the pages use (scoped to the signed-in user's session), so it answers with the
// account's real, live data. It can also PROPOSE running a capability — that
// never runs on its own; it returns a confirmation the user approves before a
// card pays. Talks to OpenRouter (default Gemini 2.5 Flash, swappable). Node
// runtime: reads a server-only key and touches server-only queries.
export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
const MAX_TOKENS = 700;
// Cap the tool loop so a confused model can never spin forever.
const MAX_TOOL_HOPS = 5;

interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
}
interface ChatMessage {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
interface OpenRouterResponse {
  choices?: { message?: ChatMessage }[];
}

const TOOLS = [
  fn("get_wallet_overview", "The user's wallet balance, total spend, and revenue."),
  fn("list_cards", "The user's Cards (agent wallets) with their live USDC balances and caps."),
  fn("list_my_capabilities", "Capabilities the user has published: name, slug, price, status."),
  fn("browse_marketplace", "Capabilities available to buy in the marketplace."),
  fn("get_recent_payments", "The user's recent settled payments (incoming and outgoing)."),
  fn("get_capability", "Details of one capability by its slug (name, operations, prices).", {
    slug: { type: "string", description: "The capability's URL slug." },
  }),
  fn(
    "run_capability",
    "Propose running ONE operation of a capability for the user. This does NOT run immediately: it returns a confirmation the user must approve before their card pays. Call it only once you know the capability slug and which operation to run.",
    {
      slug: { type: "string", description: "The capability's URL slug." },
      operation: { type: "string", description: "The operation to run (its slug or name)." },
      params: { type: "string", description: "Optional query string or JSON body for the op." },
    },
  ),
];

function fn(name: string, description: string, properties?: Record<string, unknown>) {
  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties: properties ?? {},
        required: properties ? Object.keys(properties) : [],
      },
    },
  };
}

function clip(s: string, n = 4000): string {
  return s.length > n ? `${s.slice(0, n)}… (truncated)` : s;
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Read-only tools return live data for the signed-in user, as compact JSON. */
async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "get_wallet_overview":
        return clip(JSON.stringify(await getWalletOverview()));
      case "list_cards":
        return clip(JSON.stringify(await listAgentWallets()));
      case "list_my_capabilities":
        return clip(JSON.stringify(await listMyCapabilities()));
      case "browse_marketplace":
        return clip(JSON.stringify(await listPublicCapabilities()));
      case "get_recent_payments":
        return clip(JSON.stringify(await getPaymentsData()));
      case "get_capability": {
        const slug = String(args.slug ?? "").trim();
        if (!slug) return JSON.stringify({ error: "slug is required" });
        return clip(
          JSON.stringify((await getPublicCapabilityBySlug(slug)) ?? { error: "not found" }),
        );
      }
      default:
        return JSON.stringify({ error: `unknown tool: ${name}` });
    }
  } catch (error) {
    console.error(`[copilot] tool ${name} failed:`, error);
    return JSON.stringify({ error: "that lookup failed" });
  }
}

/**
 * Resolve a proposed run: look up the REAL operation price (never trust the
 * model) and a card that can actually afford it, then return a confirm proposal.
 * Running is still enforced by the card's on-chain caps + the gateway price when
 * the user approves, so this only needs to be a good-faith preview.
 */
async function proposeRun(
  args: Record<string, unknown>,
): Promise<{ reply: string; action: ProposedAction | null }> {
  const slug = String(args.slug ?? "").trim();
  const opRef = String(args.operation ?? "").trim();
  const params = args.params ? String(args.params) : undefined;
  if (!slug) return { reply: "I need the capability's slug to run it.", action: null };

  const cap = await getPublicCapabilityBySlug(slug);
  if (!cap) return { reply: `I couldn't find a capability with slug "${slug}".`, action: null };

  const ops = cap.spec?.operations ?? [];
  const op =
    ops.find(
      (o) => (o.slug ?? kebab(o.name)) === opRef || o.name.toLowerCase() === opRef.toLowerCase(),
    ) ?? ops[0];
  if (!op) return { reply: `${cap.name} has no runnable operations.`, action: null };

  const price = op.price ?? "0";
  const total = Number(price);

  const cards = await listAgentWallets();
  const card = cards.find(
    (c) => Number(c.usdc) >= total && (!c.policy || total <= Number(c.policy.maxPerCall)),
  );
  if (!card) {
    return {
      reply:
        total > 0
          ? `Running ${op.name} costs $${price} USDC, but none of your cards can pay that right now. Fund a card first.`
          : `You don't have a card set up yet — create one under Cards first.`,
      action: null,
    };
  }

  const cost = total > 0 ? `pays $${price} USDC from your "${card.name}" card` : "is free";
  return {
    reply: `I can run **${op.name}** on ${cap.name} — it ${cost}. Confirm below to run it.`,
    action: {
      slug,
      operation: op.slug ?? kebab(op.name),
      method: op.method ?? "GET",
      params,
      cardId: card.agentId,
      cardName: card.name,
      capabilityName: cap.name,
      operationName: op.name,
      price,
    },
  };
}

function safeParseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function reply(text: string, action: ProposedAction | null = null): Response {
  return new Response(JSON.stringify({ reply: text, action }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface AgentRequestBody {
  messages?: { role: "user" | "assistant"; content: string }[];
  pageContext?: { path?: string };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    return jsonError("The copilot isn't configured yet (missing OPENROUTER_API_KEY).", 503);

  const body = (await request.json().catch(() => null)) as AgentRequestBody | null;
  const messages = body?.messages;
  if (!messages?.length || messages[messages.length - 1]?.role !== "user") {
    return jsonError("The last message must be from the user.", 400);
  }

  const page = body?.pageContext?.path;
  const system =
    DASHBOARD_SYSTEM_PROMPT + (page ? `\n\n## Current page\nThe user is on: ${page}` : "");

  const convo: ChatMessage[] = [
    { role: "system", content: system },
    ...messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let hop = 0; hop < MAX_TOOL_HOPS; hop += 1) {
    let data: OpenRouterResponse;
    try {
      const resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "HTTP-Referer": "https://taelprotocol.xyz",
          "X-Title": "Tael Copilot",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: convo,
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: MAX_TOKENS,
          temperature: 0.3,
        }),
      });
      if (!resp.ok) {
        console.error(
          "[copilot] openrouter error:",
          resp.status,
          await resp.text().catch(() => ""),
        );
        return reply("Sorry, the copilot is unavailable right now. Please try again.");
      }
      data = (await resp.json()) as OpenRouterResponse;
    } catch (error) {
      console.error("[copilot] openrouter request failed:", error);
      return reply("Sorry, something went wrong on my end. Please try again.");
    }

    const message = data.choices?.[0]?.message;
    if (!message) return reply("Sorry, I didn't get a response. Please try again.");

    if (message.tool_calls?.length) {
      // A run proposal is terminal: resolve it and return the confirm card.
      const run = message.tool_calls.find((c) => c.function.name === "run_capability");
      if (run) {
        const { reply: text, action } = await proposeRun(safeParseArgs(run.function.arguments));
        return reply(text, action);
      }
      // Otherwise run the read tools and loop with their results.
      convo.push(message);
      for (const call of message.tool_calls) {
        const out = await runTool(call.function.name, safeParseArgs(call.function.arguments));
        convo.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: out });
      }
      continue;
    }

    return reply(message.content ?? "");
  }

  return reply("I couldn't quite finish that — try rephrasing?");
}
