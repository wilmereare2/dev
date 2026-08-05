import {
  CheckCircle2,
  Lock,
  Shield,
  Sparkles,
  Star,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMarketingPanelProps = {
  variant?: "account" | "verify";
  compact?: boolean;
  className?: string;
};

const ACCOUNT_STATS = [
  { icon: Users, label: "Verified creators" },
  { icon: Video, label: "Premium releases" },
  { icon: Star, label: "Curated discovery" },
] as const;

const ACCOUNT_FEATURES = [
  "Exclusive creator profiles and cinematic playback",
  "Personal library, watch later, and subscriptions",
  "Secure billing and privacy-first age verification",
] as const;

const VERIFY_FEATURES = [
  "Privacy-protected verification — we never share your date of birth publicly",
  "Secure SSL connection for every session",
  "18+ platform with DMCA and compliance tooling built in",
] as const;

export function AuthMarketingPanel({
  variant = "account",
  compact = false,
  className,
}: AuthMarketingPanelProps) {
  const isVerify = variant === "verify";

  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/50 bg-surface/40 p-6 backdrop-blur-sm sm:p-8",
        compact ? "p-5" : "lg:p-10",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-rose-500/10 blur-3xl"
      />

      <div className="relative">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {isVerify ? <Shield className="size-3.5" /> : <Sparkles className="size-3.5" />}
          {isVerify ? "Secure entry" : "manuelaX · 18+"}
        </p>

        <h2
          className={cn(
            "mt-4 font-display font-semibold tracking-tight text-foreground",
            compact ? "text-2xl" : "text-3xl sm:text-4xl lg:text-[2.5rem] lg:leading-[1.08]",
          )}
        >
          {isVerify ? "Premium access, verified safely." : "Discover exclusive creators."}
        </h2>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isVerify
            ? "Confirm your age once to unlock the full catalog. Your verification is encrypted and stored only to keep the platform 18+."
            : "Join a premium creator platform built for cinematic releases, curated discovery, and member-only experiences."}
        </p>

        {!compact && !isVerify ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {ACCOUNT_STATS.map((entry) => {
              const Icon = entry.icon;
              return (
                <div
                  key={entry.label}
                  className="rounded-xl border border-border/40 bg-background/40 p-3 text-center"
                >
                  <Icon className="mx-auto size-5 text-accent" aria-hidden />
                  <p className="mt-2 text-xs font-medium text-foreground">{entry.label}</p>
                </div>
              );
            })}
          </div>
        ) : null}

        <ul className={cn("space-y-3", compact ? "mt-4" : "mt-8")}>
          {(isVerify ? VERIFY_FEATURES : ACCOUNT_FEATURES).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>

        {isVerify ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="size-4 text-accent" aria-hidden />
            Privacy protected · Secure verification
          </div>
        ) : (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex text-amber-400" aria-hidden>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="size-4 fill-current" />
              ))}
            </span>
            Trusted by early members and verified creators
          </div>
        )}
      </div>
    </aside>
  );
}
