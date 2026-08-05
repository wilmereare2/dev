import { SiteShell } from "@/components/layout/site-shell";
import { fetchHomePageData } from "@/services/sanity/home";
import { buildMainNav } from "@/lib/site/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchHomePageData();
  const contentReady = data.latest.length > 0;

  return (
    <SiteShell navItems={buildMainNav(contentReady)} compactFooter>
      {children}
    </SiteShell>
  );
}
