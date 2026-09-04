import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageBackground } from "@/components/layout/page-background";
import { AgeGateBanner } from "@/components/layout/age-gate-banner";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { AdProvider } from "@/components/ads/ad-context";
import { MobileStickyAd } from "@/components/ads/mobile-sticky-ad";
import { AdSlot } from "@/components/ads/ad-slot";
import { cn } from "@/lib/utils";
import type { PageBackgroundVariant } from "@/lib/site/page-theme";
import type { NavItem } from "@/types";

type SiteShellProps = {
  children: React.ReactNode;
  ageGateText?: string;
  navItems: NavItem[];
  compactFooter?: boolean;
  pageBackground?: PageBackgroundVariant;
  showSidebar?: boolean;
  wide?: boolean;
  fullWidth?: boolean;
  flush?: boolean;
  hideFooter?: boolean;
  fillViewport?: boolean;
};

export function SiteShell({
  children,
  ageGateText,
  navItems,
  compactFooter,
  pageBackground = "default",
  showSidebar = true,
  wide = false,
  fullWidth = false,
  flush = false,
  hideFooter = false,
  fillViewport = false,
}: SiteShellProps) {
  return (
    <AdProvider>
    <div className="relative flex min-h-dvh flex-col">
      <PageBackground variant={pageBackground} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,_var(--glow)_0%,_transparent_68%)]"
      />
      {ageGateText ? <AgeGateBanner message={ageGateText} /> : null}
      <Navbar navItems={navItems} />

      {/*
        Top banner under the header. Each variant is device-scoped in CSS, so
        exactly one can ever render and both collapse when unsold.
      */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdSlot placement="below_nav" collapseWhenEmpty className="mt-3" />
        <AdSlot placement="mobile_top" collapseWhenEmpty className="mt-3" />
      </div>

      <div
        className={cn(
          "relative mx-auto flex w-full flex-1 items-stretch",
          fullWidth ? "max-w-none" : wide ? "max-w-[1600px]" : "max-w-7xl",
          fullWidth
            ? "gap-4 px-4 sm:gap-6 sm:px-6 lg:gap-8 lg:px-8 xl:px-10"
            : flush
              ? "gap-0 px-0"
              : "gap-0 px-4 sm:px-6 lg:gap-8 lg:px-8",
          fillViewport && "min-h-0",
        )}
      >
        {showSidebar ? <AppSidebar /> : null}
        <main className={cn("min-w-0 flex-1", fillViewport && "flex min-h-0 flex-col")}>{children}</main>
      </div>
      <CookieConsentBanner />
      {hideFooter ? null : <Footer compact={compactFooter} />}
      <MobileStickyAd />
    </div>
    </AdProvider>
  );
}
