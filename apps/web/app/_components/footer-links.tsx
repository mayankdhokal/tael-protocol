const COLUMNS = [
  { title: "Product", links: ["Apps", "Guide", "FAQs"] },
  { title: "Try Tael", links: ["Mainnet", "Testnet"] },
];

// Real destinations for links that have one; others fall back to "#".
const HREFS: Record<string, string> = {
  Apps: "/capabilities",
  Guide: "/guide",
  FAQs: "/coming-soon",
  Mainnet: "https://mainnet.taelprotocol.xyz",
  Testnet: "https://app.taelprotocol.xyz",
};

// Community + developer accounts, shown as a row of logo icons in the footer.
const SOCIALS = {
  github: "https://github.com/tael-protocol",
  npm: "https://www.npmjs.com/package/@tael/sdk",
  discord: "https://discord.gg/tcb6b7ZYha",
  x: "https://x.com/taelprotocol?s=21",
  youtube: "https://www.youtube.com/playlist?list=PLCa8B7S0sR4g",
};

const item =
  "rounded-[6px] px-2 py-0.5 text-[14px] font-medium leading-6 tracking-[-0.02em] transition-colors";

function SocialIcon({
  label,
  href = "#",
  children,
}: {
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const external = href !== "#";
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-[#8F8E8E] transition-colors hover:text-black"
    >
      {children}
    </a>
  );
}

export function FooterLinks() {
  return (
    <div className="flex flex-col gap-16 lg:gap-[198px]">
      {/* Link columns */}
      <div className="flex gap-16 md:gap-[84px]">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col items-start gap-2">
            <span className={`${item} text-[#989898]`}>{col.title}</span>
            {col.links.map((label) => {
              const href = HREFS[label] ?? "#";
              const external = href.startsWith("http");
              return (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`${item} text-black hover:bg-[#ECECED]`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* Social icons */}
      <div className="flex items-center gap-5">
        <SocialIcon label="GitHub" href={SOCIALS.github}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.763-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.624-5.476 5.92.43.372.823 1.102.823 2.222 0 1.604-.015 2.897-.015 3.293 0 .32.216.694.825.576C20.565 22.296 24 17.798 24 12.5 24 5.87 18.627.5 12 .5z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="npm" href={SOCIALS.npm}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="Discord" href={SOCIALS.discord}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="X (Twitter)" href={SOCIALS.x}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M15.2726 1.58691H18.0838L11.9421 8.60649L19.1673 18.1586H13.51L9.07901 12.3653L4.00894 18.1586H1.19601L7.76518 10.6503L0.833984 1.58691H6.63491L10.6401 6.88219L15.2726 1.58691ZM14.2859 16.4759H15.8436L5.78848 3.18119H4.11687L14.2859 16.4759Z" />
          </svg>
        </SocialIcon>
        <SocialIcon label="YouTube" href={SOCIALS.youtube}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </SocialIcon>
      </div>
    </div>
  );
}
