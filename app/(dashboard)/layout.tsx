import { SiteLayoutClient } from "@/components/layout/site-layout-client";
import { fetchHomePageData } from "@/services/sanity/home";
import { buildMainNav } from "@/lib/site/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchHomePageData();
  const contentReady = data.latest.length > 0;
  const ageGateText = data.settings?.ageGateText;

  return (
    <SiteLayoutClient
      ageGateText={ageGateText}
      navItems={buildMainNav(contentReady)}
      compactFooter
    >
      {children}
    </SiteLayoutClient>
  );
}
