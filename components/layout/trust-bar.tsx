"use client";

import { Lock, Shield, ShieldCheck, CreditCard } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  { icon: ShieldCheck, key: "trust.verified" as const },
  { icon: Lock, key: "trust.ssl" as const },
  { icon: Shield, key: "trust.dmca" as const },
  { icon: CreditCard, key: "trust.payments" as const },
] as const;

type TrustBarProps = {
  className?: string;
  compact?: boolean;
};

export function TrustBar({ className, compact = false }: TrustBarProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "border-y border-border/50 bg-surface/30 backdrop-blur-sm",
        compact ? "py-2.5" : "py-3.5",
        className,
      )}
    >
      <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {TRUST_ITEMS.map(({ icon: Icon, key }) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs"
          >
            <Icon className="size-3.5 shrink-0 text-accent" aria-hidden />
            {t(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
