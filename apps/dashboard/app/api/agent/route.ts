import { DASHBOARD_SYSTEM_PROMPT } from "../../../features/agent/knowledge";
import { listAgentWallets } from "../../../features/agents/queries";
import {
  getPublicCapabilityBySlug,
  listMyCapabilities,
  listPublicCapabilities,
} from "../../../features/capabilities/queries";
import { getPaymentsData } from "../../../features/payments/queries";
import { getWalletOverview } from "../../../features/wallet/queries";

// The dashboard's Tael copilot. Unlike the marketing widget, it runs a tool
// loop: it can call the same server queries the pages use (scoped to the signed
// in user's session), so it answers with the account's real, live data. Talks to
// OpenRouter (OpenAI-compatible) so the model is swappable — default Gemini 2.5
// Flash. Node runtime: reads a server-only key and touches server-only queries.
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

/** Read-only tools the copilot can call. Each returns live data for the signed
 *  in user (the queries resolve the session themselves), as a compact JSON
 *  string. Read-only on purpose: the assistant can look, not spend or mutate. */
const TOOLS = [
  fn("get_wallet_overview", "The user's wallet balance, total spend, and revenue."),
  fn("list_cards", "The user's Cards (agent wallets) with their live USDC balances and caps."),
  fn("list_my_capabilities", "Capabilities the user has published: name, slug, price, status."),
  fn("browse_marketplace", "Capabilities available to buy in the marketplace."),
  fn("get_recent_payments", "The user's recent settled payments (incoming and outgoing)."),
  fn("get_capability", "Details of one capability by its slug.", {
    slug: { type: "string", description: "The capability's URL slug." },
  }),
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

function safeParseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
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

  // Last 20 turns keeps context and cost predictable.
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
        return textResponse("Sorry, the copilot is unavailable right now. Please try again.");
      }
      data = (await resp.json()) as OpenRouterResponse;
    } catch (error) {
      console.error("[copilot] openrouter request failed:", error);
      return textResponse("Sorry, something went wrong on my end. Please try again.");
    }

    const message = data.choices?.[0]?.message;
    if (!message) return textResponse("Sorry, I didn't get a response. Please try again.");

    // The model wants live data → run each tool, feed results back, loop.
    if (message.tool_calls?.length) {
      convo.push(message);
      for (const call of message.tool_calls) {
        const out = await runTool(call.function.name, safeParseArgs(call.function.arguments));
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: out,
        });
      }
      continue;
    }

    return textResponse(message.content ?? "");
  }

  return textResponse("I couldn't quite finish that — try rephrasing?");
}
