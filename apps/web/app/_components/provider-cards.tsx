/* eslint-disable @next/next/no-img-element */

const CARDS = [
  {
    logo: "/logos/logo-openai.svg",
    w: 89,
    h: 24,
    alt: "OpenAI",
    desc: "Create with powerful AI models for writing, coding, research, automation, and intelligent applications.",
  },
  {
    logo: "/logos/logo-anthropic.svg",
    w: 160,
    h: 18,
    alt: "Anthropic",
    desc: "Build reliable AI experiences with advanced models designed for reasoning, safety, and real-world work.",
  },
  {
    logo: "/logos/logo-grok.svg",
    w: 80,
    h: 30,
    alt: "Grok",
    desc: "Ask questions, explore current topics, generate ideas, and get direct answers from an AI assistant.",
  },
  {
    // Fianza (previously TrustLine), the credit partner. Text wordmark until a
    // logo asset lands in /logos.
    logo: null,
    w: 90,
    h: 24,
    alt: "Fianza",
    desc: "Give agents a credit line, so they can borrow when they're short and repay from what they earn.",
  },
  {
    // Nebula, the treasury/wallet partner. Text wordmark until a logo asset lands.
    logo: null,
    w: 90,
    h: 24,
    alt: "Nebula",
    desc: "A Stellar wallet for any AI agent, with automated yield, x402 payments, and reputation.",
  },
  {
    // Vayyl, the privacy partner. Text wordmark (the logo mark is too small to read).
    logo: null,
    w: 90,
    h: 24,
    alt: "Vayyl",
    desc: "The privacy layer for Stellar, because not everything belongs on a public ledger.",
  },
];

const pill =
  "rounded-[10px] bg-[#ECECED] px-4 py-2.5 text-[14px] font-medium tracking-[-0.02em] text-black";

export function ProviderCards() {
  return (
    <div className="flex w-full flex-col gap-7 lg:w-[728px]">
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        {CARDS.map((card) => (
          <div
            key={card.alt}
            className="flex min-h-[124px] flex-col gap-5 rounded-[11px] border border-[#E9E9E9] bg-white p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]"
          >
            {card.logo ? (
              <img src={card.logo} alt={card.alt} style={{ width: card.w, height: card.h }} />
            ) : (
              <span className="text-[24px] font-bold tracking-[-0.03em] text-black">
                {card.alt}
              </span>
            )}
            <p className="text-[13px] font-normal leading-5 tracking-[-0.03em] text-ink-muted">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA pills */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={pill}>10+ available</span>
        <a
          href="https://discord.gg/tcb6b7ZYha"
          target="_blank"
          rel="noopener noreferrer"
          className={`${pill} transition-colors hover:bg-[#e2e2e4]`}
        >
          Join community to try now
        </a>
      </div>
    </div>
  );
}
