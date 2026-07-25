import "server-only";
import { decryptSecret } from "@tael/database";

// TrustLine underwriting API. Unset means no card has a credit line, so there's
// nothing to owe and this always returns null.
const TRUSTLINE_API = process.env.TRUSTLINE_API;

/**
 * How much this card currently owes TrustLine (principal + accrued interest), as
 * a trimmed decimal string, or `null` when credit isn't configured, it owes
 * nothing, or anything goes wrong. Best-effort on purpose: it only drives a
 * display chip, so it must never throw or slow a page into failure.
 */
export async function fetchTrustLineOwed(secretEnc: string): Promise<string | null> {
  if (!TRUSTLINE_API) return null;
  try {
    const { TrustLineAgent } = await import("@trustline-agents/agent-sdk");
    const tl = new TrustLineAgent(decryptSecret(secretEnc), { apiBaseUrl: TRUSTLINE_API });
    const state = await tl.vaultState();
    const owed = Number(state.amountOwedUsdc);
    return owed > 0 ? owed.toString() : null;
  } catch {
    return null;
  }
}
