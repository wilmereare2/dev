"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import { Loader2, Send, Users, Wifi, WifiOff } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { ChatMessagePayload } from "@/lib/chat/constants";
import { cn } from "@/lib/utils";

type MemberChatRoomProps = {
  session: Session;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function roleLabel(role: string) {
  if (role === "ADMIN" || role === "MODERATOR") return role;
  if (role === "CREATOR") return "Creator";
  return null;
}

export function MemberChatRoom({ session }: MemberChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const mergeMessages = useCallback((incoming: ChatMessagePayload[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const next = [...current];
      for (const message of incoming) {
        if (!known.has(message.id)) {
          next.push(message);
          known.add(message.id);
        }
      }
      lastIdRef.current = next[next.length - 1]?.id ?? lastIdRef.current;
      return next;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      try {
        const response = await fetch("/api/chat/messages");
        const payload = (await response.json()) as { messages?: ChatMessagePayload[]; error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Could not load chat.");
          return;
        }
        if (cancelled) return;
        const initial = payload.messages ?? [];
        setMessages(initial);
        lastIdRef.current = initial[initial.length - 1]?.id ?? null;
        window.requestAnimationFrame(scrollToBottom);
      } catch {
        if (!cancelled) setError("Could not load chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [scrollToBottom]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;

    function connect() {
      const after = lastIdRef.current;
      const url = after ? `/api/chat/stream?after=${encodeURIComponent(after)}` : "/api/chat/stream";
      source = new EventSource(url);

      source.onopen = () => setLive(true);
      source.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ChatMessagePayload;
          mergeMessages([message]);
          window.requestAnimationFrame(scrollToBottom);
        } catch {
          /* ignore malformed events */
        }
      };
      source.onerror = () => {
        setLive(false);
        source?.close();
        source = null;
        reconnectTimer = window.setTimeout(connect, 2500);
      };
    }

    connect();

    return () => {
      source?.close();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, [mergeMessages, scrollToBottom]);

  useEffect(() => {
    function poll() {
      const after = lastIdRef.current;
      if (!after) return;
      fetch(`/api/chat/messages?after=${encodeURIComponent(after)}`)
        .then((response) => response.json())
        .then((payload: { messages?: ChatMessagePayload[] }) => {
          mergeMessages(payload.messages ?? []);
          window.requestAnimationFrame(scrollToBottom);
        })
        .catch(() => undefined);
    }

    pollRef.current = window.setInterval(poll, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [mergeMessages, scrollToBottom]);

  const onlineLabel = useMemo(() => {
    const unique = new Set(messages.map((message) => message.user.id));
    unique.add(session.user.id);
    return `${Math.max(unique.size, 1)} active in channel`;
  }, [messages, session.user.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { message?: ChatMessagePayload; error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not send message.");
        return;
      }

      if (payload.message) {
        mergeMessages([payload.message]);
        setDraft("");
        window.requestAnimationFrame(scrollToBottom);
      }
    } catch {
      setError("Could not send message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Member Lounge
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Community chat
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Real-time channel for verified members. Be respectful — 18+ community standards apply.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            {live ? <Wifi className="size-4 text-accent" /> : <WifiOff className="size-4" />}
            {live ? "Live" : "Reconnecting…"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4 text-accent" aria-hidden />
            {onlineLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-3xl border border-border/60 bg-surface/50 shadow-xl backdrop-blur-sm">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Loading messages…
            </div>
          ) : null}

          {!loading && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <p>No messages yet.</p>
              <p className="mt-2">Say hello to the community.</p>
            </div>
          ) : null}

          {messages.map((message) => {
            const mine = message.user.id === session.user.id;
            const badge = roleLabel(message.user.role);

            return (
              <article
                key={message.id}
                className={cn("flex gap-3", mine ? "flex-row-reverse text-right" : "text-left")}
              >
                <UserAvatar
                  name={message.user.name}
                  email={null}
                  image={message.user.image}
                  size="sm"
                  className="mt-1"
                />
                <div className={cn("min-w-0 max-w-[85%]", mine ? "items-end" : "items-start")}>
                  <div className={cn("flex flex-wrap items-center gap-2", mine ? "justify-end" : "")}>
                    <p className="text-sm font-medium text-foreground">
                      {message.user.displayName ?? message.user.name ?? "Member"}
                    </p>
                    {badge ? (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        {badge}
                      </span>
                    ) : null}
                    <time className="text-xs text-muted-foreground" dateTime={message.createdAt}>
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                  <div
                    className={cn(
                      "mt-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      mine
                        ? "bg-accent text-accent-foreground"
                        : "border border-border/60 bg-background/70 text-foreground",
                    )}
                  >
                    {message.body}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border/60 bg-background/60 px-4 py-4 sm:px-6"
        >
          {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-3">
            <label htmlFor="member-chat-input" className="sr-only">
              Message
            </label>
            <input
              id="member-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message to the lounge…"
              maxLength={2000}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            <Button type="submit" variant="premium" disabled={pending || !draft.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" />}
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Need account help?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Contact support
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
