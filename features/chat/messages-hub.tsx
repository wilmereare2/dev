"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type {
  ChatMessagePayload,
  DirectConversationPayload,
  DirectMessagePayload,
  MemberSummaryPayload,
} from "@/lib/chat/constants";
import { cn } from "@/lib/utils";

type MessagesHubProps = {
  session: Session;
};

type Tab = "community" | "private";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function roleLabel(role: string) {
  if (role === "ADMIN" || role === "MODERATOR") return role;
  if (role === "CREATOR") return "Creator";
  return "Member";
}

function isStaff(role?: string | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function MessagesHub({ session }: MessagesHubProps) {
  const staff = isStaff(session.user.role);
  const [tab, setTab] = useState<Tab>("community");

  const [communityMessages, setCommunityMessages] = useState<ChatMessagePayload[]>([]);
  const [communityDraft, setCommunityDraft] = useState("");
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityPending, setCommunityPending] = useState(false);
  const [communityLive, setCommunityLive] = useState(false);
  const [deletingCommunityId, setDeletingCommunityId] = useState<string | null>(null);
  const communityLastIdRef = useRef<string | null>(null);
  const communityScrollRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<DirectConversationPayload[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessagePayload[]>([]);
  const [directDraft, setDirectDraft] = useState("");
  const [directError, setDirectError] = useState<string | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [directPending, setDirectPending] = useState(false);
  const [deletingDirectId, setDeletingDirectId] = useState<string | null>(null);
  const directLastIdRef = useRef<string | null>(null);
  const directScrollRef = useRef<HTMLDivElement>(null);

  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<MemberSummaryPayload[]>([]);
  const [knownMembers, setKnownMembers] = useState<MemberSummaryPayload[]>([]);
  const [memberSearchPending, setMemberSearchPending] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const mergeCommunityMessages = useCallback((incoming: ChatMessagePayload[]) => {
    if (!incoming.length) return;
    setCommunityMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const next = [...current];
      for (const message of incoming) {
        if (!known.has(message.id)) {
          next.push(message);
          known.add(message.id);
        }
      }
      communityLastIdRef.current = next[next.length - 1]?.id ?? communityLastIdRef.current;
      return next;
    });
  }, []);

  const replaceCommunityMessages = useCallback((messages: ChatMessagePayload[]) => {
    setCommunityMessages(messages);
    communityLastIdRef.current = messages[messages.length - 1]?.id ?? null;
  }, []);

  const mergeDirectMessages = useCallback((incoming: DirectMessagePayload[]) => {
    if (!incoming.length) return;
    setDirectMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const next = [...current];
      for (const message of incoming) {
        if (!known.has(message.id)) {
          next.push(message);
          known.add(message.id);
        }
      }
      directLastIdRef.current = next[next.length - 1]?.id ?? directLastIdRef.current;
      return next;
    });
  }, []);

  const scrollCommunityToBottom = useCallback(() => {
    const node = communityScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  const scrollDirectToBottom = useCallback(() => {
    const node = directScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunity() {
      setCommunityLoading(true);
      try {
        const response = await fetch("/api/chat/messages");
        const payload = (await response.json()) as { messages?: ChatMessagePayload[]; error?: string };
        if (!response.ok) {
          setCommunityError(payload.error ?? "Could not load community chat.");
          return;
        }
        if (cancelled) return;
        replaceCommunityMessages(payload.messages ?? []);
        window.requestAnimationFrame(scrollCommunityToBottom);
      } catch {
        if (!cancelled) setCommunityError("Could not load community chat.");
      } finally {
        if (!cancelled) setCommunityLoading(false);
      }
    }

    loadCommunity();
    return () => {
      cancelled = true;
    };
  }, [replaceCommunityMessages, scrollCommunityToBottom]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;

    function connect() {
      const after = communityLastIdRef.current;
      const url = after ? `/api/chat/stream?after=${encodeURIComponent(after)}` : "/api/chat/stream";
      source = new EventSource(url);

      source.onopen = () => setCommunityLive(true);
      source.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ChatMessagePayload;
          mergeCommunityMessages([message]);
          window.requestAnimationFrame(scrollCommunityToBottom);
        } catch {
          /* ignore malformed events */
        }
      };
      source.onerror = () => {
        setCommunityLive(false);
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
  }, [mergeCommunityMessages, scrollCommunityToBottom]);

  useEffect(() => {
    const poll = window.setInterval(() => {
      fetch("/api/chat/messages?sync=1")
        .then((response) => response.json())
        .then((payload: { messages?: ChatMessagePayload[] }) => {
          replaceCommunityMessages(payload.messages ?? []);
        })
        .catch(() => undefined);
    }, 12_000);

    return () => window.clearInterval(poll);
  }, [replaceCommunityMessages]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await fetch("/api/chat/direct/conversations");
        const payload = (await response.json()) as {
          conversations?: DirectConversationPayload[];
          error?: string;
        };
        if (!response.ok || cancelled) return;
        setConversations(payload.conversations ?? []);
      } catch {
        /* ignore */
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setDirectMessages([]);
      directLastIdRef.current = null;
      return;
    }

    let cancelled = false;
    setDirectLoading(true);
    setDirectError(null);

    fetch(`/api/chat/direct/conversations/${selectedConversationId}/messages`)
      .then((response) => response.json())
      .then((payload: { messages?: DirectMessagePayload[]; error?: string }) => {
        if (cancelled) return;
        if (payload.error) {
          setDirectError(payload.error);
          return;
        }
        const messages = payload.messages ?? [];
        setDirectMessages(messages);
        directLastIdRef.current = messages[messages.length - 1]?.id ?? null;
        window.requestAnimationFrame(scrollDirectToBottom);
      })
      .catch(() => {
        if (!cancelled) setDirectError("Could not load private messages.");
      })
      .finally(() => {
        if (!cancelled) setDirectLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scrollDirectToBottom, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const poll = window.setInterval(() => {
      const after = directLastIdRef.current;
      const url = after
        ? `/api/chat/direct/conversations/${selectedConversationId}/messages?after=${encodeURIComponent(after)}`
        : `/api/chat/direct/conversations/${selectedConversationId}/messages`;

      fetch(url)
        .then((response) => response.json())
        .then((payload: { messages?: DirectMessagePayload[] }) => {
          mergeDirectMessages(payload.messages ?? []);
          window.requestAnimationFrame(scrollDirectToBottom);
        })
        .catch(() => undefined);
    }, 4000);

    return () => window.clearInterval(poll);
  }, [mergeDirectMessages, scrollDirectToBottom, selectedConversationId]);

  useEffect(() => {
    if (!showMemberPicker) return;

    let cancelled = false;
    setMemberSearchPending(true);

    Promise.all([
      fetch("/api/chat/members?known=1").then((response) => response.json()),
      fetch(`/api/chat/members?q=${encodeURIComponent(memberQuery)}`).then((response) => response.json()),
    ])
      .then(([knownPayload, searchPayload]) => {
        if (cancelled) return;
        setKnownMembers((knownPayload as { members?: MemberSummaryPayload[] }).members ?? []);
        setMemberResults((searchPayload as { members?: MemberSummaryPayload[] }).members ?? []);
      })
      .finally(() => {
        if (!cancelled) setMemberSearchPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memberQuery, showMemberPicker]);

  const onlineLabel = useMemo(() => {
    const unique = new Set(communityMessages.map((message) => message.user.id));
    unique.add(session.user.id);
    return `${Math.max(unique.size, 1)} active in channel`;
  }, [communityMessages, session.user.id]);

  async function handleCommunitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = communityDraft.trim();
    if (!body || communityPending) return;

    setCommunityPending(true);
    setCommunityError(null);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { message?: ChatMessagePayload; error?: string };

      if (!response.ok) {
        setCommunityError(payload.error ?? "Could not send message.");
        return;
      }

      if (payload.message) {
        mergeCommunityMessages([payload.message]);
        setCommunityDraft("");
        window.requestAnimationFrame(scrollCommunityToBottom);
      }
    } catch {
      setCommunityError("Could not send message.");
    } finally {
      setCommunityPending(false);
    }
  }

  async function handleDeleteCommunityMessage(messageId: string) {
    if (!staff || deletingCommunityId) return;
    setDeletingCommunityId(messageId);
    setCommunityError(null);

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setCommunityError(payload.error ?? "Could not delete message.");
        return;
      }
      setCommunityMessages((current) => current.filter((message) => message.id !== messageId));
    } catch {
      setCommunityError("Could not delete message.");
    } finally {
      setDeletingCommunityId(null);
    }
  }

  async function handleDirectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId) return;

    const body = directDraft.trim();
    if (!body || directPending) return;

    setDirectPending(true);
    setDirectError(null);

    try {
      const response = await fetch(`/api/chat/direct/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { message?: DirectMessagePayload; error?: string };

      if (!response.ok) {
        setDirectError(payload.error ?? "Could not send message.");
        return;
      }

      if (payload.message) {
        mergeDirectMessages([payload.message]);
        setDirectDraft("");
        window.requestAnimationFrame(scrollDirectToBottom);
        setConversations((current) =>
          current
            .map((conversation) =>
              conversation.id === selectedConversationId
                ? {
                    ...conversation,
                    updatedAt: payload.message!.createdAt,
                    lastMessage: payload.message!,
                  }
                : conversation,
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
      }
    } catch {
      setDirectError("Could not send message.");
    } finally {
      setDirectPending(false);
    }
  }

  async function handleDeleteDirectMessage(messageId: string) {
    if (!staff || deletingDirectId) return;
    setDeletingDirectId(messageId);
    setDirectError(null);

    try {
      const response = await fetch(`/api/chat/direct/messages/${messageId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDirectError(payload.error ?? "Could not delete message.");
        return;
      }
      setDirectMessages((current) => current.filter((message) => message.id !== messageId));
    } catch {
      setDirectError("Could not delete message.");
    } finally {
      setDeletingDirectId(null);
    }
  }

  async function startConversation(peerId: string) {
    setDirectError(null);
    try {
      const response = await fetch("/api/chat/direct/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });
      const payload = (await response.json()) as {
        conversation?: DirectConversationPayload;
        error?: string;
      };

      if (!response.ok || !payload.conversation) {
        setDirectError(payload.error ?? "Could not start conversation.");
        return;
      }

      setConversations((current) => {
        const existing = current.filter((item) => item.id !== payload.conversation!.id);
        return [payload.conversation!, ...existing];
      });
      setSelectedConversationId(payload.conversation.id);
      setShowMemberPicker(false);
      setMemberQuery("");
      setTab("private");
    } catch {
      setDirectError("Could not start conversation.");
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-border/60 bg-surface/40 px-3 py-2 text-sm text-muted-foreground transition hover:border-accent/40 hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to home
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Messages
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Member messaging
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Community lounge and private member messages. Be respectful — 18+ community standards apply.
          </p>
        </div>

        {tab === "community" ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              {communityLive ? <Wifi className="size-4 text-accent" /> : <WifiOff className="size-4" />}
              {communityLive ? "Live" : "Reconnecting…"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-accent" aria-hidden />
              {onlineLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("community")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
            tab === "community"
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border/60 bg-surface/40 text-muted-foreground hover:text-foreground",
          )}
        >
          <MessagesSquare className="size-4" aria-hidden />
          Community chat
        </button>
        <button
          type="button"
          onClick={() => setTab("private")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
            tab === "private"
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border/60 bg-surface/40 text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="size-4" aria-hidden />
          Private messages
        </button>
      </div>

      {tab === "community" ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/50 shadow-xl">
          <div ref={communityScrollRef} className="max-h-[520px] overflow-y-auto">
            {communityLoading ? (
              <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Loading messages…
              </div>
            ) : null}

            {!communityLoading && communityMessages.length === 0 ? (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                No messages yet. Say hello to the community.
              </p>
            ) : null}

            {!communityLoading && communityMessages.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 text-left text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="hidden px-4 py-3 md:table-cell">Time</th>
                    {staff ? <th className="px-4 py-3 text-right">Action</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {communityMessages.map((message) => (
                    <tr key={message.id} className="border-t border-border/60 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={message.user.name}
                            email={null}
                            image={message.user.image}
                            size="sm"
                          />
                          <span className="font-medium">{message.user.name ?? "Member"}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {roleLabel(message.user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-pre-wrap break-words">{message.body}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                      </td>
                      {staff ? (
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingCommunityId === message.id}
                            onClick={() => handleDeleteCommunityMessage(message.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            {deletingCommunityId === message.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="size-4" aria-hidden />
                            )}
                            Delete
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>

          <form onSubmit={handleCommunitySubmit} className="border-t border-border/60 bg-background/60 px-4 py-4">
            {communityError ? <p className="mb-3 text-sm text-red-400">{communityError}</p> : null}
            <div className="flex gap-3">
              <label htmlFor="community-chat-input" className="sr-only">
                Community message
              </label>
              <input
                id="community-chat-input"
                value={communityDraft}
                onChange={(event) => setCommunityDraft(event.target.value)}
                placeholder="Write a message to the lounge…"
                maxLength={2000}
                className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
              />
              <Button type="submit" variant="premium" disabled={communityPending || !communityDraft.trim()}>
                {communityPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" />
                )}
                Send
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/50">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-sm font-medium">Conversations</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowMemberPicker((value) => !value)}>
                <UserPlus className="size-4" aria-hidden />
                New
              </Button>
            </div>

            {showMemberPicker ? (
              <div className="border-b border-border/60 px-4 py-3">
                <label htmlFor="member-search" className="sr-only">
                  Search members
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="member-search"
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Search all members…"
                    className="h-10 w-full rounded-lg border border-border bg-background/80 pl-9 pr-3 text-sm outline-none focus-visible:border-accent/60"
                  />
                </div>

                {memberSearchPending ? (
                  <p className="mt-3 text-xs text-muted-foreground">Searching…</p>
                ) : (
                  <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
                    {knownMembers.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          People you know
                        </p>
                        <ul className="mt-2 space-y-1">
                          {knownMembers.slice(0, 8).map((member) => (
                            <li key={`known-${member.id}`}>
                              <button
                                type="button"
                                onClick={() => startConversation(member.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                              >
                                <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
                                <span>{member.name ?? "Member"}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        All members
                      </p>
                      <ul className="mt-2 space-y-1">
                        {memberResults.map((member) => (
                          <li key={member.id}>
                            <button
                              type="button"
                              onClick={() => startConversation(member.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                            >
                              <UserAvatar name={member.name} email={null} image={member.image} size="sm" />
                              <span>{member.name ?? "Member"}</span>
                              {member.known ? (
                                <span className="ml-auto text-[10px] uppercase text-accent">Known</span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="max-h-[420px] overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No private conversations yet. Start one with any member.
                </p>
              ) : (
                <ul>
                  {conversations.map((conversation) => (
                    <li key={conversation.id} className="border-b border-border/40 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/30",
                          selectedConversationId === conversation.id && "bg-accent/10",
                        )}
                      >
                        <UserAvatar
                          name={conversation.peer.name}
                          email={null}
                          image={conversation.peer.image}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {conversation.peer.name ?? "Member"}
                            </p>
                            {conversation.lastMessage ? (
                              <time className="shrink-0 text-[11px] text-muted-foreground">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </time>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {conversation.lastMessage?.body ?? "No messages yet"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-surface/50">
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Select a conversation or start a new private message.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                  <UserAvatar
                    name={selectedConversation.peer.name}
                    email={null}
                    image={selectedConversation.peer.image}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium">{selectedConversation.peer.name ?? "Member"}</p>
                    <p className="text-xs text-muted-foreground">
                      Private message · {roleLabel(selectedConversation.peer.role)}
                    </p>
                  </div>
                </div>

                <div ref={directScrollRef} className="flex-1 overflow-y-auto">
                  {directLoading ? (
                    <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Loading messages…
                    </div>
                  ) : null}

                  {!directLoading && directMessages.length === 0 ? (
                    <p className="px-4 py-16 text-center text-sm text-muted-foreground">
                      No messages yet. Send the first private message.
                    </p>
                  ) : null}

                  {!directLoading && directMessages.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/80 text-left text-muted-foreground backdrop-blur">
                        <tr>
                          <th className="px-4 py-3">From</th>
                          <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                          <th className="px-4 py-3">Message</th>
                          <th className="hidden px-4 py-3 md:table-cell">Time</th>
                          {staff ? <th className="px-4 py-3 text-right">Action</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {directMessages.map((message) => (
                          <tr key={message.id} className="border-t border-border/60 align-top">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  name={message.sender.name}
                                  email={null}
                                  image={message.sender.image}
                                  size="sm"
                                />
                                <span className="font-medium">
                                  {message.sender.id === session.user.id
                                    ? "You"
                                    : (message.sender.name ?? "Member")}
                                </span>
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                              <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {roleLabel(message.sender.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-pre-wrap break-words">{message.body}</td>
                            <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                              <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
                            </td>
                            {staff ? (
                              <td className="px-4 py-3 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingDirectId === message.id}
                                  onClick={() => handleDeleteDirectMessage(message.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  {deletingDirectId === message.id ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                  ) : (
                                    <Trash2 className="size-4" aria-hidden />
                                  )}
                                  Delete
                                </Button>
                              </td>
                            ) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>

                <form onSubmit={handleDirectSubmit} className="border-t border-border/60 bg-background/60 px-4 py-4">
                  {directError ? <p className="mb-3 text-sm text-red-400">{directError}</p> : null}
                  <div className="flex gap-3">
                    <label htmlFor="direct-chat-input" className="sr-only">
                      Private message
                    </label>
                    <input
                      id="direct-chat-input"
                      value={directDraft}
                      onChange={(event) => setDirectDraft(event.target.value)}
                      placeholder={`Message ${selectedConversation.peer.name ?? "member"}…`}
                      maxLength={2000}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background/80 px-4 text-sm outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
                    />
                    <Button type="submit" variant="premium" disabled={directPending || !directDraft.trim()}>
                      {directPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
