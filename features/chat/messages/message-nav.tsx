"use client";

import type { CSSProperties, ReactNode } from "react";
import { Lock, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import type { MessageKey } from "@/lib/i18n";

export type InboxFilter = "all" | "groups" | "private";

const FILTERS: { id: InboxFilter; labelKey: MessageKey; icon: typeof MessageSquare }[] = [
  { id: "all", labelKey: "chat.allMessages", icon: MessageSquare },
  { id: "groups", labelKey: "chat.groups", icon: Users },
  { id: "private", labelKey: "chat.private", icon: Lock },
];

type MessageNavProps = {
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  layout?: "sidebar" | "tabs";
  className?: string;
  style?: CSSProperties;
  actions?: ReactNode;
};

export function MessageNav({ filter, onFilterChange, layout = "sidebar", className, style, actions }: MessageNavProps) {
  const { t } = useI18n();
  if (layout === "tabs") {
    return (
      <nav
        aria-label={t("chat.allMessages")}
        className={cn(
          "flex gap-1 overflow-x-auto border-b border-border/60 px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        {FILTERS.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs",
              filter === id
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label={t("nav.messages")}
      style={style}
      className={cn("flex h-full shrink-0 flex-col border-r border-border/60 bg-background/30", className)}
    >
      <div className="border-b border-border/60 px-4 py-4">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("nav.messages")}
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {FILTERS.map(({ id, labelKey, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onFilterChange(id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition",
                filter === id
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {t(labelKey)}
            </button>
          </li>
        ))}
      </ul>
      {actions ? <div className="mt-auto border-t border-border/60 p-2">{actions}</div> : null}
    </nav>
  );
}
