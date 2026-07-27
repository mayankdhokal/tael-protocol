import type { Metadata } from "next";
import { SiteHeader } from "../_components/site-header";
import { FooterLinks } from "../_components/footer-links";
import { ProviderCards } from "../_components/provider-cards";

export const metadata: Metadata = {
  title: "Whitepaper — Tael",
  description:
    "Tael: the payment layer for autonomous AI agents. How agents pay per call in USDC on Stellar over the x402 standard, the protocol architecture, its security model, and the road toward one API for every capability on Stellar.",
};

const MAINNET_URL = "https://mainnet.taelprotocol.xyz";

type Block =
  { type: "p"; text: string } | { type: "h3"; text: string } | { type: "list"; items: string[] };

interface Section {
  id: string;
  num: string;
  title: string;
  blocks: Block[];
}

const ABSTRACT =
  "Autonomous AI agents can reason, browse, and call software, but they cannot pay for any of it. Tael is the payment layer that closes this gap. Every agent gets a Card, a non-custodial Stellar wallet bound by a spending policy it can never exceed, and pays per call in USDC for any API, tool, model, or dataset over the open HTTP 402 (x402) standard. Publishers wrap a service, set a price, and earn on every successful call, settled on-chain and independently verifiable. On top of this settlement layer, Tael runs a capability marketplace and an autonomous agent that discovers, pays for, and composes those capabilities on a user's behalf. This paper describes the problem, the protocol, its security and trust model, and the road toward a single API for every capability on Stellar.";

const SECTIONS: Section[] = [
  {
    id: "problem",
    num: "01",
    title: "The transaction gap",
    blocks: [
      {
        type: "p",
        text: "AI agents have crossed a threshold. They plan, write code, browse the web, and call APIs on their own. But at the moment an agent needs to pay for something, a model call, a dataset, a premium API, it stops. The rails we built for humans do not fit software that acts without a person in the loop.",
      },
      {
        type: "p",
        text: "Every existing option breaks down for autonomous agents:",
      },
      {
        type: "list",
        items: [
          "Credit cards assume a human. There is no way to scope spend to a single call, no clean per-call metering, and chargebacks and PCI obligations make card-on-file a poor fit for software that transacts thousands of times an hour.",
          "Subscriptions are the wrong unit. Agents make sporadic, unpredictable calls across many services. Paying a monthly fee to every provider an agent might touch is wasteful and does not scale.",
          "API keys are manual and static. Someone has to sign up, provision a key, and fund an account for every service, then hope the key is never leaked. Keys carry no spending bound and no native metering.",
        ],
      },
      {
        type: "p",
        text: "What agents need is money that is native to how they operate: programmable, bounded, per-call, permissionless, and settled instantly. That is the layer Tael provides.",
      },
    ],
  },
  {
    id: "principles",
    num: "02",
    title: "Design principles",
    blocks: [
      {
        type: "p",
        text: "Tael is built around a small set of commitments that shape every decision in the protocol:",
      },
      {
        type: "list",
        items: [
          "Per-call micropayments. The unit of payment is a single call, not a plan or a seat.",
          "Non-custodial. An agent's keys are its own. Tael never takes custody of user funds.",
          "Bounded spend. Every wallet carries a policy, a maximum per call and a daily limit, that it cannot exceed, even if compromised.",
          "Permissionless. Payment is the authentication. No accounts to create, no keys to hand out.",
          "Open standard. Payments ride the public HTTP 402 / x402 protocol, not a proprietary API.",
          "Serve-then-settle. A call that fails is never charged.",
          "Instant, atomic settlement. Value moves on-chain in one transaction, with a receipt anyone can verify.",
        ],
      },
    ],
  },
  {
    id: "primitives",
    num: "03",
    title: "Primitives",
    blocks: [
      {
        type: "h3",
        text: "HTTP 402 and x402",
      },
      {
        type: "p",
        text: "HTTP status code 402, Payment Required, has been reserved in the web standard for decades and left largely unused. The x402 pattern revives it: a server responds to an unpaid request with 402 and a machine-readable description of what payment it will accept. The client attaches a signed payment and retries. Tael implements this flow so that any HTTP service can require payment without a bespoke billing integration.",
      },
      {
        type: "h3",
        text: "Stellar and USDC",
      },
      {
        type: "p",
        text: "Payments settle in USDC on Stellar. Stellar offers fast finality and fees low enough that a sub-cent payment is economical, which is what per-call pricing demands. USDC is a fully reserved stablecoin, so prices and payouts are denominated in dollars rather than a volatile asset. Because Stellar assets are permissioned by trustlines, a wallet must explicitly trust USDC to hold or receive it, a property Tael surfaces throughout the product.",
      },
    ],
  },
  {
    id: "architecture",
    num: "04",
    title: "Protocol architecture",
    blocks: [
      {
        type: "h3",
        text: "Cards",
      },
      {
        type: "p",
        text: "A Card is an agent's wallet: a Stellar account that holds USDC and signs its own payments. It is non-custodial, and its private key is encrypted at rest. Each Card carries a spending policy with a maximum per call and a daily limit. These bounds are enforced before any payment is signed, so a compromised or misbehaving agent still cannot spend beyond its policy. This turns a wallet into a safe, delegable budget.",
      },
      {
        type: "h3",
        text: "Capabilities",
      },
      {
        type: "p",
        text: "A Capability is anything sellable per call: an API, an MCP tool, a model, an agent, or a dataset. A publisher wraps an upstream service, sets a price for each operation, and adds a payout wallet. Publishing makes the service reachable through Tael and, if listed, discoverable in the marketplace. Every successful call pays the publisher's wallet directly.",
      },
      {
        type: "h3",
        text: "The gateway",
      },
      {
        type: "p",
        text: "The gateway sits between the paying agent and the upstream service. It answers an unpaid request with a 402 challenge that states the price and the destination. The agent's Card signs a payment, which it presents on retry. The gateway verifies the payment, settles it on-chain, and only then forwards the request to the upstream and returns the response, along with a receipt.",
      },
      {
        type: "h3",
        text: "Serve-then-settle",
      },
      {
        type: "p",
        text: "Payment and delivery are bound together. If the upstream call fails, the agent is not charged. This removes the classic risk of paying for a request that never succeeds, and it is enforced by the protocol rather than left to a provider's goodwill.",
      },
      {
        type: "h3",
        text: "Settlement",
      },
      {
        type: "p",
        text: "Settlement is a single Stellar transaction that atomically splits the payment between the publisher's payout wallet and the protocol fee. Because it is one on-chain transaction, either the whole payment succeeds or none of it does. The gateway returns a receipt with the transaction hash, so any payment can be independently verified on a public block explorer.",
      },
    ],
  },
  {
    id: "flow",
    num: "05",
    title: "The payment flow",
    blocks: [
      {
        type: "p",
        text: "End to end, a paid call proceeds as follows:",
      },
      {
        type: "list",
        items: [
          "The agent requests a capability with no payment attached.",
          "The gateway responds 402 with the accepted payment: the amount, the asset (USDC), the destination, and the protocol fee.",
          "The agent's Card enforces its spending policy, then signs a Stellar payment covering the amount and fee.",
          "The agent retries the request with the signed payment attached.",
          "The gateway verifies the payment, settles it on-chain in one atomic transaction, and forwards the request upstream.",
          "The upstream response is returned to the agent together with a receipt containing the settlement transaction hash.",
        ],
      },
      {
        type: "p",
        text: "The flow is protected against replay and double-spending: each settlement is idempotent, and a repeated payment inserts nothing new. Payments are bound to the request that produced the challenge, so a receipt cannot be reused against a different call.",
      },
    ],
  },
  {
    id: "security",
    num: "06",
    title: "Security and trust",
    blocks: [
      {
        type: "list",
        items: [
          "Non-custodial by default. Keys belong to the wallet owner and never leave the server unencrypted. Tael cannot move funds a policy does not permit.",
          "Bounded blast radius. A compromised agent is still capped by its per-call and daily limits, so the worst case is bounded rather than catastrophic.",
          "Serve-then-settle. Failed work is never charged, removing the incentive and the risk of paying for nothing.",
          "On-chain proof. Every payment produces a verifiable transaction. Trust does not rest on Tael's word; it rests on the ledger.",
          "No chargebacks. Settlement is final, which is what a publisher needs to serve an anonymous, autonomous buyer with confidence.",
        ],
      },
    ],
  },
  {
    id: "network",
    num: "07",
    title: "The capability network",
    blocks: [
      {
        type: "p",
        text: "Individual paid endpoints become far more valuable when they are discoverable and composable. Tael's marketplace lists capabilities so that agents and builders can find them, compare prices, and call them through one interface.",
      },
      {
        type: "p",
        text: "This creates a two-sided network. More capabilities make Tael more useful to agents; more agents make Tael more attractive to publishers. Publishers earn on every successful call with instant, on-chain payout, which turns an existing API into a revenue stream without a billing team. For a product, being listed also raises visibility and credibility across the ecosystem.",
      },
    ],
  },
  {
    id: "agents",
    num: "08",
    title: "Autonomous agents",
    blocks: [
      {
        type: "p",
        text: "Above the settlement and marketplace layers, Tael runs an autonomous agent. From a product's own information and capabilities, the agent can operate that product on a user's behalf: it reads live account data, runs capabilities, and settles payments, with each action confirmed by the user in a single click so spend always stays within policy.",
      },
      {
        type: "p",
        text: "Because capabilities are priced and composable, an agent can chain several to complete a task, and it can manage its own budget. When a Card is short on USDC, it can draw on a credit line from a partner such as Fianza to finish a call and repay from later earnings, so a temporary shortfall does not stall the work. The result is software that discovers, pays for, and composes services with no manual steps.",
      },
    ],
  },
  {
    id: "economics",
    num: "09",
    title: "Economics",
    blocks: [
      {
        type: "p",
        text: "Tael is denominated in USDC, not a native token. Publishers set the price of each operation and receive their share of every successful call directly to their payout wallet. Value accrues to the protocol only when real work is paid for, which keeps incentives aligned with the people building and using capabilities.",
      },
      {
        type: "h3",
        text: "How Tael makes money",
      },
      {
        type: "p",
        text: "The revenue model has two primary engines:",
      },
      {
        type: "list",
        items: [
          "A per-call protocol fee. Tael takes a small fee on every paid capability call, settled in the same atomic transaction as the publisher payout. Because settlement on Stellar costs a fraction of a cent, even sub-cent calls are economical, so the fee can stay low enough to be a non-issue on any single call. Revenue is a function of transaction volume, and the model is built for millions of calls.",
          "Autonomous agents as a product. Tael builds and hosts an autonomous agent for a product from its own capabilities and information, and charges per conversation the agent handles: product pitch, customer support, lead capture, and running the product's own functions in natural language. The product gets an agent that works around the clock; Tael earns on usage.",
        ],
      },
      {
        type: "h3",
        text: "Additional layers",
      },
      {
        type: "p",
        text: "Beyond the two engines, the same platform opens further revenue with almost no added cost to serve:",
      },
      {
        type: "list",
        items: [
          "First-party capabilities. Tael publishes and prices its own high-value capabilities, such as on-chain payments, swaps, and quotes, and earns on them directly.",
          "Marketplace promotion. Publishers can pay for featured placement and visibility, the way an app store surfaces standout apps.",
          "Credit. When agents borrow against future earnings through a credit partner, Tael can share in the financing.",
          "Conversion and swaps. When a payment has to be converted into USDC to settle, a small spread on that swap is captured in the same flow.",
          "Enterprise and white-label. Larger products pay for dedicated guardrails, higher limits, service levels, and a white-labeled agent.",
        ],
      },
      {
        type: "p",
        text: "The unifying thesis is volume. Low per-transaction cost on Stellar is not a constraint, it is the advantage: it lets Tael price its fee low enough that no single call is worth optimizing away, and still build a large business on the sheer number of transactions an agent economy generates.",
      },
    ],
  },
  {
    id: "ecosystem",
    num: "10",
    title: "Ecosystem",
    blocks: [
      {
        type: "p",
        text: "Tael is built on Stellar and settles in Circle's USDC. It composes with a growing set of ecosystem partners: Fianza for credit, so agents can borrow against future earnings; Nebula for agent treasury and wallets; and Vayyl for privacy. Model and tool providers plug in as capabilities. Each partner strengthens the same shared layer rather than fragmenting it.",
      },
    ],
  },
  {
    id: "roadmap",
    num: "11",
    title: "The road ahead",
    blocks: [
      {
        type: "p",
        text: "Tael is being built in three phases. The following is forward-looking and describes direction, not guarantees.",
      },
      {
        type: "list",
        items: [
          "Phase 1, the payment layer. Cards, capabilities, the 402 gateway, and on-chain settlement. This is live.",
          "Phase 2, the capability network. A deeper marketplace where capabilities are discovered, priced, and composed, and where products earn from each other's usage.",
          "Phase 3, the autonomous operating system. Agents that plan, pay, compose, and self-manage across many capabilities, with credit and reputation built in.",
        ],
      },
      {
        type: "h3",
        text: "One API for every capability on Stellar",
      },
      {
        type: "p",
        text: "The end state we are building toward is a single API that reaches every capability on Stellar. Today, integrating with several Stellar products means several accounts, several SDKs, and repeated work. On Tael, once a product is live, it becomes callable, and payable, by any agent and any other product through the same interface. Products stop rebuilding the same plumbing and start integrating with each other. The benchmark we hold ourselves to is integration in minutes, not months.",
      },
    ],
  },
  {
    id: "open-work",
    num: "12",
    title: "Open work",
    blocks: [
      {
        type: "p",
        text: "Tael is early, and we would rather be precise about what is not finished than overstate it. The main areas of active and upcoming work:",
      },
      {
        type: "list",
        items: [
          "Richer spending guardrails: allow and deny lists, per-capability budgets, rate limits, and finer policy controls beyond per-call and daily caps.",
          "Scheduled and recurring payments that survive beyond a single session, backed by server-side execution.",
          "Broader settlement: streaming payments and multi-asset support.",
          "Deeper credit and on-chain reputation, so an agent's track record informs what it can borrow and access.",
          "A single, unified API and SDKs across every Stellar capability, the one-API goal described above.",
          "Independent audits of the settlement path as it hardens for mainnet scale.",
        ],
      },
    ],
  },
  {
    id: "conclusion",
    num: "13",
    title: "Conclusion",
    blocks: [
      {
        type: "p",
        text: "If AI agents are going to become real participants on the internet, they need financial infrastructure of their own: a way to pay, be paid, and be bounded while doing so. Tael provides that layer, non-custodial, per-call, and settled on-chain, and builds a marketplace and an autonomous agent on top of it. The direction is a single, open API through which every capability on Stellar can be discovered, called, and paid for by anyone, human or agent.",
      },
    ],
  },
];

const GLOSSARY = [
  ["Card", "An agent's non-custodial Stellar wallet, bounded by a spending policy."],
  ["Capability", "Anything sellable per call: an API, tool, model, agent, or dataset."],
  [
    "Gateway",
    "The service that issues 402 challenges, settles payments, and serves upstream responses.",
  ],
  ["402 / x402", "The HTTP standard for requiring and attaching payment to a request."],
  [
    "Trustline",
    "A Stellar authorization a wallet must hold to receive a given asset, such as USDC.",
  ],
  ["Receipt", "The proof of a settled payment, including its on-chain transaction hash."],
];

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h3") {
          return (
            <h3 key={i} className="mt-8 text-[19px] font-semibold tracking-[-0.01em] text-ink">
              {b.text}
            </h3>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="mt-4 space-y-2.5">
              {b.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[16px] leading-7 tracking-[-0.01em] text-ink-soft"
                >
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-4 text-[16px] leading-8 tracking-[-0.01em] text-ink-soft">
            {b.text}
          </p>
        );
      })}
    </>
  );
}

export default function WhitepaperPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section
        className="px-6 pb-16 pt-24"
        style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #000000 60%, #18181B 100%)" }}
      >
        <div className="mx-auto max-w-[820px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/50">
            Whitepaper · v1.0
          </p>
          <h1 className="mt-4 text-[38px] font-normal leading-[1.1] tracking-[-0.03em] text-white sm:text-[52px]">
            The payment layer for autonomous AI agents.
          </h1>
          <p className="mt-6 text-[16px] leading-8 tracking-[-0.01em] text-white/65">{ABSTRACT}</p>
        </div>
      </section>

      <main className="bg-white text-ink">
        <div className="mx-auto max-w-[820px] px-6 py-16">
          {/* Contents */}
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Contents
          </p>
          <ol className="mt-4 flex flex-col divide-y divide-line rounded-xl border border-line">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-4 px-5 py-3 text-[15px] tracking-[-0.01em] text-ink-soft transition-colors hover:bg-surface/60 hover:text-ink"
                >
                  <span className="text-[13px] tabular-nums text-ink-muted">{s.num}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>

          {/* Sections */}
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 pt-14">
              <p className="text-[13px] font-medium tabular-nums text-ink-muted">{s.num}</p>
              <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
                {s.title}
              </h2>
              <Blocks blocks={s.blocks} />
            </section>
          ))}

          {/* Glossary */}
          <section className="scroll-mt-20 pt-14">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em]">Glossary</h2>
            <dl className="mt-6 flex flex-col divide-y divide-line rounded-xl border border-line">
              {GLOSSARY.map(([term, def]) => (
                <div key={term} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
                  <dt className="w-40 shrink-0 text-[15px] font-semibold text-ink">{term}</dt>
                  <dd className="text-[15px] leading-7 tracking-[-0.01em] text-ink-soft">{def}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap items-center gap-3">
            <a
              href={MAINNET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[14px] bg-accent px-6 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Try on Mainnet
            </a>
            <a
              href="/docs"
              className="inline-flex items-center rounded-[14px] border border-line px-6 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-surface"
            >
              Read the docs
            </a>
          </div>
        </div>

        {/* Footer */}
        <section className="border-t border-line bg-white pb-24 pt-16">
          <div className="mx-auto flex max-w-[1160px] flex-col gap-16 px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <FooterLinks />
            <ProviderCards />
          </div>
        </section>
      </main>
    </>
  );
}
