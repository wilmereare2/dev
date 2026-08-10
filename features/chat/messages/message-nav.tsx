"use client";

import type { CSSProperties, ReactNode } from "react";
import { Lock, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type InboxFilter = "all" | "groups" | "private";

const FILTERS: { id: InboxFilter; label: string; icon: typeof MessageSquare }[] = [
  { id: "all", label: "All Messages", icon: MessageSquare },
  { id: "groups", label: "Groups", icon: Users },
  { id: "private", label: "Private", icon: Lock },
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
  if (layout === "tabs") {
    return (
      <nav aria-label="Message filters" className={cn("flex gap-1 border-b border-border/60 px-3 py-2", className)}>
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              filter === id
                ? "bg-accent/15 text-accent"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Messages"
      style={style}
      className={cn("flex h-full shrink-0 flex-col border-r border-border/60 bg-background/30", className)}
    >
      <div className="border-b border-border/60 px-4 py-4">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Messages
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {FILTERS.map(({ id, label, icon: Icon }) => (
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
              {label}
            </button>
          </li>
        ))}
      </ul>
      {actions ? <div className="mt-auto border-t border-border/60 p-2">{actions}</div> : null}
    </nav>
  );
}
