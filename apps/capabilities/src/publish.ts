// Publish (or update) Tael's first-party capabilities to the marketplace using
// the SDK. Run after deploying this service:
//
//   TAEL_KEY=tael_live_… PAY_TO=G… CAPABILITIES_URL=https://… \
//     pnpm --filter capabilities publish:capabilities
//
// It upserts every capability in the registry (by name): a first run publishes
// it, and every re-run UPDATES the live one in place. Re-running is safe — it
// never creates a duplicate and never resets a granted Verified badge. Each
// capability's manifest lives beside its routes in src/capabilities/<name>/.
//
// To publish a network-specific variant (e.g. mainnet alongside testnet), set
// NAME_SUFFIX (appended to every capability name) and TAEL_BASE_URL (the target
// gateway):
//
//   TAEL_KEY=… PAY_TO=… CAPABILITIES_URL=https://…mainnet-upstream \
//     NAME_SUFFIX=" (Mainnet)" TAEL_BASE_URL=https://…mainnet-gateway \
//     pnpm --filter capabilities publish:capabilities
//
// The suffix keeps the mainnet records distinct from testnet (upsert matches the
// suffixed name), so re-running never disturbs the testnet capabilities.
import { Tael, TaelError } from "@tael/sdk";
import { capabilities } from "./registry.generated";

const apiKey = process.env.TAEL_KEY;
const payTo = process.env.PAY_TO;
// Trim any trailing slash so operation paths (e.g. /stellar/balance) don't
// produce a double slash when appended to the upstream endpoint.
const endpoint = (process.env.CAPABILITIES_URL ?? "http://localhost:3004").replace(/\/+$/, "");
// Appended to every capability name to publish a network-specific variant (e.g.
// " (Mainnet)"), so those records stay distinct from the testnet ones.
const nameSuffix = process.env.NAME_SUFFIX ?? "";
// Which gateway to publish through; defaults to the SDK's own base URL.
const baseUrl = process.env.TAEL_BASE_URL;

if (!apiKey || !payTo) {
  console.error("Set TAEL_KEY and PAY_TO (and CAPABILITIES_URL to the deployed service).");
  process.exit(1);
}

const tael = new Tael(baseUrl ? { apiKey, baseUrl } : { apiKey });

// What we already publish, so a re-run updates in place instead of duplicating.
const owned = await tael.myCapabilities();

for (const { manifest } of capabilities) {
  // Suffix the name for network-specific variants (e.g. "Stellar (Mainnet)").
  const name = `${manifest.name}${nameSuffix}`;
  // endpoint + payTo are the same for every first-party capability, injected here.
  const full = { ...manifest, name, endpoint, payTo };
  try {
    const existing = owned.find((c) => c.name === name);
    if (existing) {
      const result = await tael.updateCapability(existing.id, full);
      console.log(`Updated "${name}" → ${result.slug}`);
      console.log(`  https://app.taelprotocol.xyz/marketplace/${result.slug}`);
      continue;
    }
    const result = await tael.publish(full);
    console.log(`Published "${name}" → ${result.slug} (${result.status})`);
    console.log(`  https://app.taelprotocol.xyz/marketplace/${result.slug}`);
  } catch (err) {
    if (err instanceof TaelError) {
      console.error(`Failed to publish "${name}": ${err.status} ${err.message}`);
    } else {
      console.error(`Failed to publish "${name}":`, err);
    }
    process.exitCode = 1;
  }
}
