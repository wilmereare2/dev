"use client";

import { useState } from "react";
import { Check, CheckCheck, Copy, Loader2, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { MessageGroupPosition } from "@/features/chat/chat-format";
import { formatBubbleTime } from "@/features/chat/chat-format";
import { cn } from "@/lib/utils";

type ChatMessageBubbleProps = {
  body: string;
  createdAt: string;
  mine: boolean;
  senderName: string;
  senderImage: string | null;
  senderRole?: string;
  showAvatar?: boolean;
  showSenderName?: boolean;
  groupPosition?: MessageGroupPosition;
  readAt?: string | null;
  showReadStatus?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

function roleLabel(role?: string) {
  if (role === "ADMIN" || role === "MODERATOR") return role;
  if (role === "CREATOR") return "Creator";
  return null;
}

function bubbleRadius(mine: boolean, position: MessageGroupPosition) {
  if (mine) {
    switch (position) {
      case "first":
        return "rounded-[12px] rounded-br-[4px]";
      case "middle":
        return "rounded-[12px] rounded-br-[4px] rounded-tr-[4px]";
      case "last":
        return "rounded-[12px] rounded-tr-[4px]";
      default:
        return "rounded-[12px]";
    }
  }

  switch (position) {
    case "first":
      return "rounded-[12px] rounded-bl-[4px]";
    case "middle":
      return "rounded-[12px] rounded-bl-[4px] rounded-tl-[4px]";
    case "last":
      return "rounded-[12px] rounded-tl-[4px]";
    default:
      return "rounded-[12px]";
  }
}

function hasTail(mine: boolean, position: MessageGroupPosition) {
  return position === "single" || position === "last";
}

export function ChatMessageBubble({
  body,
  createdAt,
  mine,
  senderName,
  senderImage,
  senderRole,
  showAvatar = true,
  showSenderName = false,
  groupPosition = "single",
  readAt = null,
  showReadStatus = false,
  canDelete = false,
  deleting = false,
  onDelete,
}: ChatMessageBubbleProps) {
  const badge = roleLabel(senderRole);
  const [copied, setCopied] = useState(false);
  const tail = hasTail(mine, groupPosition);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className={cn("group flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
      {showAvatar ? (
        <UserAvatar name={senderName} email={null} image={senderImage} size="sm" className="mt-auto shrink-0" />
      ) : (
        <div className="size-8 shrink-0" aria-hidden />
      )}

      <div className={cn("flex min-w-0 max-w-[min(75%,520px)] flex-col", mine ? "items-end" : "items-start")}>
        {showSenderName ? (
          <div className="mb-1 flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs font-semibold text-sky-400">{senderName}</span>
            {badge ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {badge}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="relative max-w-full">
          <div
            onContextMenu={(event) => {
              event.preventDefault();
              void copyMessage();
            }}
            className={cn(
              "relative inline-block max-w-full px-2.5 pb-1.5 pt-1.5 text-[15px] leading-[1.35] shadow-sm",
              bubbleRadius(mine, groupPosition),
              mine ? "chat-bubble-outgoing" : "chat-bubble-incoming",
              tail && !mine && "chat-bubble-tail-in",
              tail && mine && "chat-bubble-tail-out",
            )}
          >
            <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{body}</span>
            <span
              className={cn(
                "float-right ml-3 mt-2 inline-flex translate-y-0.5 items-center gap-1 text-[11px] leading-none select-none",
                mine ? "text-accent-foreground/70" : "text-[var(--chat-incoming-meta)]",
              )}
            >
              {copied ? <span className="text-[10px]">Copied</span> : null}
              <time dateTime={createdAt}>{formatBubbleTime(createdAt)}</time>
              {showReadStatus ? (
                readAt ? (
                  <CheckCheck className="size-3.5 opacity-90" aria-label="Read" />
                ) : (
                  <Check className="size-3.5 opacity-80" aria-label="Sent" />
                )
              ) : null}
            </span>
          </div>

          <div
            className={cn(
              "absolute top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100",
              mine ? "-left-[4.5rem]" : "-right-[4.5rem]",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label="Copy message"
              onClick={() => void copyMessage()}
            >
              <Copy className="size-3.5" aria-hidden />
            </Button>
            {canDelete && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={deleting}
                onClick={onDelete}
                className="size-7 text-red-400 hover:text-red-300"
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
      </div>
    </article>
  );
}
