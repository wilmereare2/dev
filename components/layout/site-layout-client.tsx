"use client";

import { usePathname } from "next/navigation";
import { ComplianceGateShell } from "@/components/layout/compliance-gate-shell";
import { SiteShell } from "@/components/layout/site-shell";
import { shouldShowAppSidebar } from "@/components/layout/app-sidebar";
import { resolvePageBackground } from "@/lib/site/page-theme";
import type { NavItem } from "@/types";

type SiteLayoutClientProps = {
  children: React.ReactNode;
  ageGateText?: string;
  navItems: NavItem[];
  compactFooter?: boolean;
};

export function SiteLayoutClient({
  children,
  ageGateText,
  navItems,
  compactFooter,
}: SiteLayoutClientProps) {
  const pathname = usePathname();
  const isComplianceGate = pathname === "/verify-age";
  const pageBackground = resolvePageBackground(pathname);

  if (isComplianceGate) {
    return <ComplianceGateShell>{children}</ComplianceGateShell>;
  }

  return (
    <SiteShell
      ageGateText={ageGateText}
      navItems={navItems}
      compactFooter={compactFooter}
      pageBackground={pageBackground}
      showSidebar={shouldShowAppSidebar(pathname)}
    >
      {children}
    </SiteShell>
  );
}
