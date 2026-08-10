import Link from "next/link";
import { Shield } from "lucide-react";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type ComplianceGateShellProps = {
  children: React.ReactNode;
};

export function ComplianceGateShell({ children }: ComplianceGateShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--glow)_0%,_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/8 via-transparent to-indigo-500/5"
      />

      <header className="relative z-10 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            manuela<span className="text-accent">X</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-14">
          <AuthMarketingPanel variant="verify" compact className="lg:hidden" />
          <AuthMarketingPanel variant="verify" className="hidden lg:block" />
          <div className="w-full lg:justify-self-end">{children}</div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/40 bg-background/50 px-4 py-5 text-center backdrop-blur-sm sm:px-6">
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-3.5 shrink-0 text-accent" aria-hidden />
          18+ only · Legal age required in your region
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/contact" className="text-accent hover:underline">
            Contact
          </Link>
        </p>
      </footer>
    </div>
  );
}
