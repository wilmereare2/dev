import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AgeGateBanner } from "@/components/layout/age-gate-banner";
import type { NavItem } from "@/types";

type SiteShellProps = {
  children: React.ReactNode;
  ageGateText?: string;
  navItems: NavItem[];
  compactFooter?: boolean;
};

export function SiteShell({ children, ageGateText, navItems, compactFooter }: SiteShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_at_top,_var(--glow)_0%,_transparent_68%)]"
      />
      {ageGateText ? <AgeGateBanner message={ageGateText} /> : null}
      <Navbar navItems={navItems} />
      <main className="relative flex-1">{children}</main>
      <Footer compact={compactFooter} />
    </div>
  );
}
