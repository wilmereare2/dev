"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/features/chat/chat-message-bubble";
import {
  formatDateDivider,
  getMessageGroupPosition,
  groupsWithPrevious,
  isSameCalendarDay,
} from "@/features/chat/chat-format";
import { ChatMessagesSkeleton, InlineErrorState } from "@/features/chat/messages/loading-skeleton";
import { EmptyState } from "@/features/chat/messages/empty-state";
import { cn } from "@/lib/utils";

export type ChatListMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  senderRole?: string;
  readAt?: string | null;
};

type ChatMessageListProps = {
  messages: ChatListMessage[];
  currentUserId: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showSenderNames?: boolean;
  showReadStatus?: boolean;
  canDelete?: boolean;
  deletingId?: string | null;
  onDelete?: (messageId: string) => void;
  searchQuery?: string;
};

export function ChatMessageList({
  messages,
  currentUserId,
  scrollRef,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "No messages yet",
  emptyDescription,
  showSenderNames = false,
  showReadStatus = false,
  canDelete = false,
  deletingId = null,
  onDelete,
  searchQuery = "",
}: ChatMessageListProps) {
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const lastSeenCountRef = useRef(messages.length);

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((message) => message.body.toLowerCase().includes(query));
  }, [messages, searchQuery]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior });
      setShowScrollDown(false);
      setUnreadBelow(0);
      lastSeenCountRef.current = messages.length;
    },
    [messages.length, scrollRef],
  );

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 96;
    setShowScrollDown(!nearBottom);
    if (nearBottom) {
      setUnreadBelow(0);
      lastSeenCountRef.current = messages.length;
    }
  }, [messages.length, scrollRef]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    return () => node.removeEventListener("scroll", updateScrollState);
  }, [scrollRef, updateScrollState, messages.length]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 96;
    if (nearBottom) {
      lastSeenCountRef.current = messages.length;
      setUnreadBelow(0);
      return;
    }

    const added = messages.length - lastSeenCountRef.current;
    if (added > 0) {
      setUnreadBelow((current) => current + added);
      setShowScrollDown(true);
    }
  }, [messages.length, scrollRef]);

  const sameSender = useCallback(
    (left: ChatListMessage, right: ChatListMessage) => left.senderId === right.senderId,
    [],
  );

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} className="chat-thread-panel absolute inset-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4">
          {loading ? <ChatMessagesSkeleton /> : null}

          {!loading && error ? (
            <InlineErrorState message={error} onRetry={onRetry} />
          ) : null}

          {!loading && !error && filteredMessages.length === 0 ? (
            searchQuery.trim() ? (
              <EmptyState
                title="No matching messages"
                description="Try a different search term."
              />
            ) : (
              <EmptyState title={emptyTitle} description={emptyDescription} />
            )
          ) : null}

          {!loading && !error
            ? filteredMessages.map((message, index) => {
                const mine = message.senderId === currentUserId;
                const previous = filteredMessages[index - 1];
                const position = getMessageGroupPosition(filteredMessages, index, sameSender);
                const showDateDivider =
                  index === 0 || !isSameCalendarDay(previous.createdAt, message.createdAt);
                const groupedWithPrevious = groupsWithPrevious(previous, message, sameSender);
                const showAvatar = !mine && (position === "last" || position === "single");
                const showSenderName =
                  showSenderNames && !mine && (position === "first" || position === "single");

                return (
                  <div key={message.id}>
                    {showDateDivider ? (
                      <div className="my-5 flex items-center gap-3 px-1">
                        <div className="h-px flex-1 bg-border/60" aria-hidden />
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {formatDateDivider(message.createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-border/60" aria-hidden />
                      </div>
                    ) : null}
                    <div className={cn("flex", mine ? "justify-end" : "justify-start", groupedWithPrevious ? "mt-1" : "mt-3")}>
                      <ChatMessageBubble
                        body={message.body}
                        createdAt={message.createdAt}
                        mine={mine}
                        senderName={message.senderName}
                        senderImage={message.senderImage}
                        senderRole={message.senderRole}
                        showAvatar={showAvatar}
                        showSenderName={showSenderName}
                        groupPosition={position}
                        readAt={message.readAt}
                        showReadStatus={showReadStatus && mine}
                        canDelete={canDelete}
                        deleting={deletingId === message.id}
                        onDelete={onDelete ? () => onDelete(message.id) : undefined}
                      />
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </div>

      {showScrollDown ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={unreadBelow > 0 ? `${unreadBelow} new messages` : "Scroll to latest messages"}
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 z-10 size-10 rounded-full shadow-lg"
        >
          <ChevronDown className="size-5" aria-hidden />
          {unreadBelow > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {unreadBelow > 99 ? "99+" : unreadBelow}
            </span>
          ) : null}
        </Button>
      ) : null}
    </div>
  );
}
