import { SidebarTrigger } from "@tael/ui";
import { ThemeToggle } from "./theme-toggle";
import { PayoutGuideLink } from "./payout-guide-link";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-1">
        <PayoutGuideLink />
        <ThemeToggle />
      </div>
    </header>
  );
}
