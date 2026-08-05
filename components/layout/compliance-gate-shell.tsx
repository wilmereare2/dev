import Link from "next/link";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type ComplianceGateShellProps = {
  children: React.ReactNode;
};

export function ComplianceGateShell({ children }: ComplianceGateShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--glow)_0%,_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-background"
      />

      <header className="relative z-10 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            manuela<span className="text-accent">X</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
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
