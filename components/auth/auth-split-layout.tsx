import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  variant?: "account" | "verify";
  className?: string;
};

/**
 * Two-column auth layout: marketing on the left, the form on the right.
 *
 * Sign-in and registration share it. Registration used to render a stacked
 * single-column variant, which left the left half of a desktop viewport empty
 * once sign-up was reduced to one step.
 */
export function AuthSplitLayout({ children, variant = "account", className }: AuthSplitLayoutProps) {
  return (
    <section
      className={cn(
        // The split only goes two-column at xl. At lg the 440px form column
        // left the marketing panel ~449px wide, which is narrower than its own
        // desktop styling (p-10, 2.5rem heading, 3-up stat grid) can fit — the
        // heading and stat row overflowed and were clipped.
        "relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:items-center xl:gap-14 xl:px-8 xl:py-16",
        className,
      )}
    >
      <AuthMarketingPanel variant={variant} compact className="xl:hidden" />
      <AuthMarketingPanel variant={variant} className="hidden xl:block" />
      <div className="w-full xl:justify-self-end">{children}</div>
    </section>
  );
}
