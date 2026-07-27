import type { Metadata } from "next";
import { SiteHeader } from "../_components/site-header";
import { FooterLinks } from "../_components/footer-links";
import { ProviderCards } from "../_components/provider-cards";

export const metadata: Metadata = {
  title: "Guide — Tael",
  description:
    "What Tael is and how it works: price your capabilities, reach every user and agent through one API, and get an autonomous agent that runs your product.",
};

const MAINNET_URL = "https://mainnet.taelprotocol.xyz";
const YOUTUBE_URL = "https://www.youtube.com/playlist?list=PLCa8B7S0sR4g";

const WHAT = [
  {
    title: "Price your capabilities",
    body: "Expose your product's best actions and set a per-call price. Every successful call pays you, instantly, in USDC.",
  },
  {
    title: "Accessible to anyone, and any agent",
    body: "Humans and AI agents can discover, call, and pay for your capabilities over one open standard. No accounts to hand out.",
  },
  {
    title: "A marketplace that grows you",
    body: "Get listed and get found. Being on Tael raises your product's visibility and credibility across the ecosystem.",
  },
];

const AGENT_DOES = [
  "Runs every function your product offers, with no manual steps.",
  "Pitches your whole product, so even a first-time visitor knows exactly what to do.",
  "Handles customer support and explains your product clearly.",
  "Captures leads and books meetings with your founders.",
  "Pay, swap, TrustLine, and more, built in.",
];

const GETS = [
  {
    title: "Monetisation",
    body: "Earn per call on every capability you expose. Real revenue, settled on-chain.",
  },
  {
    title: "Integration in under 5 minutes",
    body: "That is the benchmark once a product is live on Tael. One API, not ten accounts.",
  },
  {
    title: "An autonomous agent",
    body: "It handles your product pitch, leads, support, meetings, and runs your product in natural English.",
  },
];

const ASK = [
  "What is Tael?",
  "How can I publish my capabilities?",
  "How do I make a card or API key to access capabilities?",
];

const primaryCta =
  "inline-flex items-center gap-2 rounded-[14px] bg-accent px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.16)] transition-opacity hover:opacity-90";
const secondaryCtaDark =
  "inline-flex items-center rounded-[14px] border border-white/25 px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10";

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GuidePage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section
        className="px-6 pb-20 pt-24 text-center"
        style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #000000 55%, #18181B 100%)" }}
      >
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/50">Guide</p>
        <h1 className="mx-auto mt-4 max-w-[720px] text-[40px] font-normal leading-[1.1] tracking-[-0.03em] text-white sm:text-[56px]">
          Tael is the backbone for your product.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[18px] leading-7 tracking-[-0.02em] text-white/65">
          Connect your best capabilities, put a price on them, and get an autonomous agent that runs
          your product for your users. One API, live in minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={MAINNET_URL} target="_blank" rel="noopener noreferrer" className={primaryCta}>
            Try on Mainnet
            <ArrowIcon />
          </a>
          <a href="/docs" className={secondaryCtaDark}>
            Read the docs
          </a>
        </div>
      </section>

      <main className="bg-white text-ink">
        {/* What is Tael */}
        <section className="mx-auto max-w-[1080px] px-6 py-20">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            What is Tael
          </p>
          <h2 className="mt-3 max-w-[720px] text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
            Think of Tael as a backbone.
          </h2>
          <p className="mt-4 max-w-[680px] text-[17px] leading-8 tracking-[-0.01em] text-ink-soft">
            Tael sits under your product and keeps it strong. You connect your product&apos;s best
            capabilities and give each one a price. Tael makes them accessible to everyone, and even
            AI agents can call and pay for them. Its marketplace puts your product in front of new
            users and builds credibility.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {WHAT.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-surface/40 p-6">
                <p className="text-[16px] font-semibold tracking-[-0.01em]">{c.title}</p>
                <p className="mt-2 text-[14px] leading-6 tracking-[-0.01em] text-ink-soft">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Autonomous agent */}
        <section className="bg-[#0B0B0C] text-white">
          <div className="mx-auto max-w-[1080px] px-6 py-20">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">
              Autonomous agent
            </p>
            <h2 className="mt-3 max-w-[760px] text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
              Your own autonomous agent, built from your product.
            </h2>
            <p className="mt-4 max-w-[720px] text-[17px] leading-8 tracking-[-0.01em] text-white/70">
              From your docs, product information, mission, and capabilities, Tael builds an
              autonomous agent for your platform. It does not just answer questions. It runs your
              product. Your users say what they want in plain English, and the agent does it, so
              they never have to figure out manual steps.
            </p>
            <ul className="mt-8 grid max-w-[860px] grid-cols-1 gap-3 sm:grid-cols-2">
              {AGENT_DOES.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[15px] leading-6 tracking-[-0.01em] text-white/80"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
              <p className="text-[16px] leading-7 tracking-[-0.01em] text-white/85">
                One API for all of it. No juggling ten different accounts to build on Stellar, Tael
                gives you every capability through a single API. It is powerful even right now.
              </p>
            </div>
            <div className="mt-8">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryCtaDark}
              >
                Watch the demo
                <span className="ml-2">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* What your product gets */}
        <section className="mx-auto max-w-[1080px] px-6 py-20">
          <h2 className="max-w-[720px] text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
            What your product gets.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {GETS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-surface/40 p-6">
                <p className="text-[16px] font-semibold tracking-[-0.01em]">{c.title}</p>
                <p className="mt-2 text-[14px] leading-6 tracking-[-0.01em] text-ink-soft">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto max-w-[1080px] px-6 py-16">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Mission
            </p>
            <h2 className="mt-3 max-w-[760px] text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
              Autonomous agents for every Stellar product.
            </h2>
            <p className="mt-4 max-w-[680px] text-[17px] leading-8 tracking-[-0.01em] text-ink-soft">
              Live on Tael, every product is reachable through the same API. We have already
              partnered with 6 products in the ecosystem, and we are just getting started.
            </p>
          </div>
        </section>

        {/* Ask the agent */}
        <section className="mx-auto max-w-[1080px] px-6 py-20">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
            Have a question? Ask the agent.
          </h2>
          <p className="mt-3 max-w-[620px] text-[16px] leading-7 tracking-[-0.01em] text-ink-soft">
            The Tael agent is on the site, bottom right. Ask it anything while you explore, or try
            it inside the app. A few good starters:
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {ASK.map((q) => (
              <span
                key={q}
                className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-medium tracking-[-0.01em] text-ink"
              >
                {q}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={MAINNET_URL} target="_blank" rel="noopener noreferrer" className={primaryCta}>
              Try on Mainnet
              <ArrowIcon />
            </a>
            <a
              href="/docs"
              className="inline-flex items-center rounded-[14px] border border-line px-6 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-surface"
            >
              Read the docs
            </a>
          </div>
        </section>

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
