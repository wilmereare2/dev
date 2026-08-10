"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ConversationItemProps = {
  active?: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  preview: string;
  time?: string;
  unreadCount?: number;
  badge?: ReactNode;
  meta?: ReactNode;
  iconOnly?: boolean;
};

export function ConversationItem({
  active,
  onClick,
  icon,
  title,
  preview,
  time,
  unreadCount = 0,
  badge,
  meta,
  iconOnly = false,
}: ConversationItemProps) {
  const unread = unreadCount > 0;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={unread ? `${title}, ${unreadCount} unread messages` : title}
        className={cn(
          "relative flex w-full items-center justify-center rounded-xl p-1.5 transition",
          active ? "bg-accent/15 ring-2 ring-accent/40" : "hover:bg-muted/40",
        )}
      >
        {icon}
        {unread ? (
          <span className="absolute right-1 top-1 size-2.5 rounded-full border-2 border-background bg-accent" aria-hidden />
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active ? "bg-accent/10 ring-1 ring-accent/20" : "hover:bg-muted/35",
        unread && !active && "bg-muted/20",
      )}
    >
      <div className="relative shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium")}>{title}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {badge}
            {time ? <time className="text-[11px] text-muted-foreground">{time}</time> : null}
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              unread ? "font-medium text-foreground/90" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          {unread ? (
            <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </div>
        {meta ? <div className="mt-1">{meta}</div> : null}
      </div>
      {unread ? (
        <span className="sr-only">{unreadCount} unread messages</span>
      ) : null}
    </button>
  );
}
