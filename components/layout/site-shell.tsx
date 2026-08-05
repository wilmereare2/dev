import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AppSidebar, shouldShowAppSidebar } from "@/components/layout/app-sidebar";
import { PageBackground } from "@/components/layout/page-background";
import { AgeGateBanner } from "@/components/layout/age-gate-banner";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import type { PageBackgroundVariant } from "@/lib/site/page-theme";
import type { NavItem } from "@/types";

type SiteShellProps = {
  children: React.ReactNode;
  ageGateText?: string;
  navItems: NavItem[];
  compactFooter?: boolean;
  pageBackground?: PageBackgroundVariant;
  showSidebar?: boolean;
};

export function SiteShell({
  children,
  ageGateText,
  navItems,
  compactFooter,
  pageBackground = "default",
  showSidebar = true,
}: SiteShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PageBackground variant={pageBackground} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,_var(--glow)_0%,_transparent_68%)]"
      />
      {ageGateText ? <AgeGateBanner message={ageGateText} /> : null}
      <Navbar navItems={navItems} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {showSidebar ? <AppSidebar /> : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CookieConsentBanner />
      <Footer compact={compactFooter} />
    </div>
  );
}
