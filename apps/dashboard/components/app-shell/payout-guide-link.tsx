"use client";

import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@tael/ui";

/** Where the publisher-facing payout guide lives (marketing site docs). */
const PAYOUT_DOCS_URL = "https://taelprotocol.xyz/docs/payouts";

/**
 * A quiet link to the payout guide, shown on the capabilities pages, where a
 * publisher is most likely to wonder how earnings reach their wallet. Sits just
 * left of the theme toggle in the topbar.
 */
export function PayoutGuideLink() {
  const pathname = usePathname();
  if (!pathname?.includes("/capabilities")) return null;

  return (
    <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
      <a href={PAYOUT_DOCS_URL} target="_blank" rel="noopener noreferrer">
        <Wallet />
        Payout setup
      </a>
    </Button>
  );
}
