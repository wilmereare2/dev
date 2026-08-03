import { SiteShell } from "@/components/layout/site-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { fetchHomePageData } from "@/services/sanity/home";
import { buildMainNav } from "@/lib/site/nav";

const DEFAULT_AGE =
  "18+ only. By entering you confirm you are of legal age in your region.";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchHomePageData();
  const contentReady = data.latest.length > 0;
  const ageGateText = data.settings?.ageGateText || DEFAULT_AGE;

  return (
    <AuthSessionProvider>
      <SiteShell
        ageGateText={ageGateText}
        navItems={buildMainNav(contentReady)}
        compactFooter={!contentReady}
      >
        {children}
      </SiteShell>
    </AuthSessionProvider>
  );
}
