"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/features/chat/chat-message-bubble";
import {
  formatDateDivider,
  getMessageGroupPosition,
  groupsWithPrevious,
  isSameCalendarDay,
} from "@/features/chat/chat-format";
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
  emptyText?: string;
  showSenderNames?: boolean;
  showReadStatus?: boolean;
  canDelete?: boolean;
  deletingId?: string | null;
  onDelete?: (messageId: string) => void;
  onScrollToBottom?: () => void;
};

function mapToListMessage(
  message: ChatListMessage,
): ChatListMessage {
  return message;
}

export function ChatMessageList({
  messages,
  currentUserId,
  scrollRef,
  loading = false,
  emptyText = "No messages yet.",
  showSenderNames = false,
  showReadStatus = false,
  canDelete = false,
  deletingId = null,
  onDelete,
  onScrollToBottom,
}: ChatMessageListProps) {
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const lastSeenCountRef = useRef(messages.length);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior });
      setShowScrollDown(false);
      setUnreadBelow(0);
      lastSeenCountRef.current = messages.length;
      onScrollToBottom?.();
    },
    [messages.length, onScrollToBottom, scrollRef],
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
      <div
        ref={scrollRef}
        className="chat-thread-panel absolute inset-0 overflow-y-auto px-2 py-3 sm:px-3"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Loading messages…
          </div>
        ) : null}

        {!loading && messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : null}

        {!loading
          ? messages.map((message, index) => {
              const mapped = mapToListMessage(message);
              const mine = mapped.senderId === currentUserId;
              const previous = messages[index - 1];
              const position = getMessageGroupPosition(messages, index, sameSender);
              const showDateDivider =
                index === 0 || !isSameCalendarDay(previous.createdAt, mapped.createdAt);
              const groupedWithPrevious = groupsWithPrevious(previous, mapped, sameSender);
              const showAvatar = !mine && (position === "last" || position === "single");
              const showSenderName =
                showSenderNames && !mine && (position === "first" || position === "single");

              return (
                <div key={mapped.id}>
                  {showDateDivider ? (
                    <div className="my-3 flex justify-center px-2">
                      <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                        {formatDateDivider(mapped.createdAt)}
                      </span>
                    </div>
                  ) : null}
                  <div className={cn(groupedWithPrevious ? "mt-0.5" : "mt-2")}>
                    <ChatMessageBubble
                      body={mapped.body}
                      createdAt={mapped.createdAt}
                      mine={mine}
                      senderName={mapped.senderName}
                      senderImage={mapped.senderImage}
                      senderRole={mapped.senderRole}
                      showAvatar={showAvatar}
                      showSenderName={showSenderName}
                      groupPosition={position}
                      readAt={mapped.readAt}
                      showReadStatus={showReadStatus && mine}
                      canDelete={canDelete}
                      deleting={deletingId === mapped.id}
                      onDelete={onDelete ? () => onDelete(mapped.id) : undefined}
                    />
                  </div>
                </div>
              );
            })
          : null}
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
