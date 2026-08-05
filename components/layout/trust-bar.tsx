import { Lock, Shield, ShieldCheck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "18+ Verified" },
  { icon: Lock, label: "SSL Secure" },
  { icon: Shield, label: "DMCA Protected" },
  { icon: CreditCard, label: "Secure Payments" },
] as const;

type TrustBarProps = {
  className?: string;
  compact?: boolean;
};

export function TrustBar({ className, compact = false }: TrustBarProps) {
  return (
    <div
      className={cn(
        "border-y border-border/50 bg-surface/30 backdrop-blur-sm",
        compact ? "py-2.5" : "py-3.5",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 sm:px-6 lg:px-8">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs"
          >
            <Icon className="size-3.5 shrink-0 text-accent" aria-hidden />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
