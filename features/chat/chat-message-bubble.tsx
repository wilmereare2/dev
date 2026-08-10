"use client";

import { Loader2, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessageBubbleProps = {
  body: string;
  createdAt: string;
  mine: boolean;
  senderName: string;
  senderImage: string | null;
  senderRole?: string;
  showSender?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function roleLabel(role?: string) {
  if (role === "ADMIN" || role === "MODERATOR") return role;
  if (role === "CREATOR") return "Creator";
  return null;
}

export function ChatMessageBubble({
  body,
  createdAt,
  mine,
  senderName,
  senderImage,
  senderRole,
  showSender = true,
  canDelete = false,
  deleting = false,
  onDelete,
}: ChatMessageBubbleProps) {
  const badge = roleLabel(senderRole);

  return (
    <article className={cn("group flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
      {showSender ? (
        <UserAvatar name={senderName} email={null} image={senderImage} size="sm" className="mt-5 shrink-0" />
      ) : (
        <div className="size-8 shrink-0" aria-hidden />
      )}

      <div className={cn("flex min-w-0 max-w-[min(100%,520px)] flex-col", mine ? "items-end" : "items-start")}>
        {showSender ? (
          <div className={cn("mb-1 flex flex-wrap items-center gap-2", mine && "flex-row-reverse")}>
            <span className="text-xs font-medium text-foreground">{senderName}</span>
            {badge ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {badge}
              </span>
            ) : null}
            <time className="text-[11px] text-muted-foreground" dateTime={createdAt}>
              {formatTime(createdAt)}
            </time>
          </div>
        ) : null}

        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
              mine
                ? "rounded-br-md bg-accent text-accent-foreground"
                : "rounded-bl-md border border-border/60 bg-background/80 text-foreground",
            )}
          >
            {body}
          </div>

          {canDelete && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={deleting}
              onClick={onDelete}
              className={cn(
                "absolute top-1/2 size-7 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100",
                mine ? "-left-9 text-red-400 hover:text-red-300" : "-right-9 text-red-400 hover:text-red-300",
              )}
              aria-label="Delete message"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
