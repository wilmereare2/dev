import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  variant?: "account" | "verify";
  className?: string;
};

export function AuthSplitLayout({ children, variant = "account", className }: AuthSplitLayoutProps) {
  return (
    <section
      className={cn(
        "relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-14 lg:px-8 lg:py-16",
        className,
      )}
    >
      <AuthMarketingPanel variant={variant} compact className="lg:hidden" />
      <AuthMarketingPanel variant={variant} className="hidden lg:block" />
      <div className="w-full lg:justify-self-end">{children}</div>
    </section>
  );
}
