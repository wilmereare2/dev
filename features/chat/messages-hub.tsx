"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import {
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  Send,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/features/chat/chat-message-bubble";
import { ConversationActionsMenu } from "@/features/chat/conversation-actions-menu";
import { CreateGroupDialog } from "@/features/chat/create-group-dialog";
import { NewMessageDialog } from "@/features/chat/new-message-dialog";
import type {
  ChatMessagePayload,
  DirectConversationPayload,
  DirectMessagePayload,
  GroupMessagePayload,
  MemberGroupPayload,
} from "@/lib/chat/constants";
import { cn } from "@/lib/utils";

type MessagesHubProps = {
  session: Session;
};

type ActiveThread =
  | { kind: "community" }
  | { kind: "direct"; conversationId: string }
  | { kind: "group"; groupId: string };

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function isStaff(role?: string | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

export function MessagesHub({ session }: MessagesHubProps) {
  const searchParams = useSearchParams();
  const staff = isStaff(session.user.role);
  const [activeThread, setActiveThread] = useState<ActiveThread>({ kind: "community" });
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [groups, setGroups] = useState<MemberGroupPayload[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessagePayload[]>([]);
  const [groupDraft, setGroupDraft] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupPending, setGroupPending] = useState(false);
  const groupLastIdRef = useRef<string | null>(null);
  const groupScrollRef = useRef<HTMLDivElement>(null);

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
  const [directMessages, setDirectMessages] = useState<DirectMessagePayload[]>([]);
  const [directDraft, setDirectDraft] = useState("");
  const [directError, setDirectError] = useState<string | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [directPending, setDirectPending] = useState(false);
  const [deletingDirectId, setDeletingDirectId] = useState<string | null>(null);
  const directLastIdRef = useRef<string | null>(null);
  const directScrollRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(() => {
    if (activeThread.kind !== "direct") return null;
    return conversations.find((conversation) => conversation.id === activeThread.conversationId) ?? null;
  }, [activeThread, conversations]);

  const selectedGroup = useMemo(() => {
    if (activeThread.kind !== "group") return null;
    return groups.find((group) => group.id === activeThread.groupId) ?? null;
  }, [activeThread, groups]);

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

  const scrollGroupToBottom = useCallback(() => {
    const node = groupScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  const mergeGroupMessages = useCallback((incoming: GroupMessagePayload[]) => {
    if (!incoming.length) return;
    setGroupMessages((current) => {
      const known = new Set(current.map((message) => message.id));
      const next = [...current];
      for (const message of incoming) {
        if (!known.has(message.id)) {
          next.push(message);
          known.add(message.id);
        }
      }
      groupLastIdRef.current = next[next.length - 1]?.id ?? groupLastIdRef.current;
      return next;
    });
  }, []);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (!conversationId) return;
    setActiveThread({ kind: "direct", conversationId });
    setMobileShowThread(true);
  }, [searchParams]);

  useEffect(() => {
    const memberId = searchParams.get("member");
    if (!memberId) return;

    void fetch("/api/chat/direct/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: memberId }),
    })
      .then((response) => response.json())
      .then((payload: { conversation?: DirectConversationPayload; error?: string }) => {
        if (!payload.conversation) return;
        setConversations((current) => {
          const existing = current.filter((item) => item.id !== payload.conversation!.id);
          return [payload.conversation!, ...existing];
        });
        setActiveThread({ kind: "direct", conversationId: payload.conversation.id });
        setMobileShowThread(true);
      })
      .catch(() => undefined);
  }, [searchParams]);

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/direct/conversations");
      const payload = (await response.json()) as { conversations?: DirectConversationPayload[] };
      setConversations(payload.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (activeThread.kind !== "direct") return;

    void fetch(`/api/chat/direct/conversations/${activeThread.conversationId}/read`, {
      method: "PATCH",
    })
      .then(() => refreshConversations())
      .catch(() => undefined);

    void fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markConversationRead: activeThread.conversationId }),
    }).catch(() => undefined);
  }, [activeThread, refreshConversations]);

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
    let cancelled = false;

    async function loadGroups() {
      try {
        const response = await fetch("/api/chat/groups");
        const payload = (await response.json()) as { groups?: MemberGroupPayload[] };
        if (!response.ok || cancelled) return;
        setGroups(payload.groups ?? []);
      } catch {
        /* ignore */
      }
    }

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeConversationId = activeThread.kind === "direct" ? activeThread.conversationId : null;
  const activeGroupId = activeThread.kind === "group" ? activeThread.groupId : null;

  useEffect(() => {
    if (!activeConversationId) {
      setDirectMessages([]);
      directLastIdRef.current = null;
      return;
    }

    let cancelled = false;
    setDirectLoading(true);
    setDirectError(null);

    fetch(`/api/chat/direct/conversations/${activeConversationId}/messages`)
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
  }, [activeConversationId, scrollDirectToBottom]);

  useEffect(() => {
    if (!activeConversationId) return;

    const poll = window.setInterval(() => {
      const after = directLastIdRef.current;
      const url = after
        ? `/api/chat/direct/conversations/${activeConversationId}/messages?after=${encodeURIComponent(after)}`
        : `/api/chat/direct/conversations/${activeConversationId}/messages`;

      fetch(url)
        .then((response) => response.json())
        .then((payload: { messages?: DirectMessagePayload[] }) => {
          mergeDirectMessages(payload.messages ?? []);
          window.requestAnimationFrame(scrollDirectToBottom);
        })
        .catch(() => undefined);
    }, 4000);

    return () => window.clearInterval(poll);
  }, [activeConversationId, mergeDirectMessages, scrollDirectToBottom]);

  useEffect(() => {
    if (!activeGroupId) {
      setGroupMessages([]);
      groupLastIdRef.current = null;
      return;
    }

    let cancelled = false;
    setGroupLoading(true);
    setGroupError(null);

    fetch(`/api/chat/groups/${activeGroupId}/messages`)
      .then((response) => response.json())
      .then((payload: { messages?: GroupMessagePayload[]; error?: string }) => {
        if (cancelled) return;
        if (payload.error) {
          setGroupError(payload.error);
          return;
        }
        const messages = payload.messages ?? [];
        setGroupMessages(messages);
        groupLastIdRef.current = messages[messages.length - 1]?.id ?? null;
        window.requestAnimationFrame(scrollGroupToBottom);
      })
      .catch(() => {
        if (!cancelled) setGroupError("Could not load group messages.");
      })
      .finally(() => {
        if (!cancelled) setGroupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeGroupId, scrollGroupToBottom]);

  useEffect(() => {
    if (!activeGroupId) return;

    const poll = window.setInterval(() => {
      fetch(`/api/chat/groups/${activeGroupId}/messages`)
        .then((response) => response.json())
        .then((payload: { messages?: GroupMessagePayload[] }) => {
          const messages = payload.messages ?? [];
          setGroupMessages(messages);
          groupLastIdRef.current = messages[messages.length - 1]?.id ?? null;
          window.requestAnimationFrame(scrollGroupToBottom);
        })
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(poll);
  }, [activeGroupId, scrollGroupToBottom]);

  const onlineLabel = useMemo(() => {
    const unique = new Set(communityMessages.map((message) => message.user.id));
    unique.add(session.user.id);
    return `${Math.max(unique.size, 1)} active`;
  }, [communityMessages, session.user.id]);

  function openCommunity() {
    setActiveThread({ kind: "community" });
    setMobileShowThread(true);
  }

  function openDirect(conversationId: string) {
    setActiveThread({ kind: "direct", conversationId });
    setMobileShowThread(true);
  }

  function openGroup(groupId: string) {
    setActiveThread({ kind: "group", groupId });
    setMobileShowThread(true);
  }

  async function handleGroupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeThread.kind !== "group") return;

    const body = groupDraft.trim();
    if (!body || groupPending) return;

    setGroupPending(true);
    setGroupError(null);

    try {
      const response = await fetch(`/api/chat/groups/${activeThread.groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = (await response.json()) as { message?: GroupMessagePayload; error?: string };

      if (!response.ok) {
        setGroupError(payload.error ?? "Could not send message.");
        return;
      }

      if (payload.message) {
        mergeGroupMessages([payload.message]);
        setGroupDraft("");
        window.requestAnimationFrame(scrollGroupToBottom);
        setGroups((current) =>
          current
            .map((group) =>
              group.id === activeThread.groupId
                ? {
                    ...group,
                    updatedAt: payload.message!.createdAt,
                    lastMessage: payload.message!,
                  }
                : group,
            )
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
      }
    } catch {
      setGroupError("Could not send message.");
    } finally {
      setGroupPending(false);
    }
  }

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
    if (activeThread.kind !== "direct") return;

    const body = directDraft.trim();
    if (!body || directPending) return;

    setDirectPending(true);
    setDirectError(null);

    try {
      const response = await fetch(`/api/chat/direct/conversations/${activeThread.conversationId}/messages`, {
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
              conversation.id === activeThread.conversationId
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
      openDirect(payload.conversation.id);
    } catch {
      setDirectError("Could not start conversation.");
    }
  }

  const threadTitle =
    activeThread.kind === "community"
      ? "Community lounge"
      : activeThread.kind === "group"
        ? (selectedGroup?.name ?? "Group chat")
        : (selectedConversation?.peer.name ?? "Private message");

  const threadSubtitle =
    activeThread.kind === "community"
      ? communityLive
        ? `Live · ${onlineLabel}`
        : "Reconnecting…"
      : activeThread.kind === "group"
        ? `${selectedGroup?.memberCount ?? 0} members`
        : "Private message";

  return (
    <>
      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-4 lg:px-6">
        <div className="flex min-h-[min(720px,calc(100dvh-var(--site-header-offset)-var(--site-bottom-offset)-4rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 shadow-xl">
          <aside
            className={cn(
              "flex w-full shrink-0 flex-col border-r border-border/60 bg-background/40 md:w-[320px]",
              mobileShowThread ? "hidden md:flex" : "flex",
            )}
          >
            <div className="border-b border-border/60 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="font-display text-xl font-semibold tracking-tight">Messages</h1>
                  <p className="text-xs text-muted-foreground">Community, groups & private chats</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowCreateGroup(true)}
                    aria-label="Create group"
                  >
                    <UserPlus className="size-4" aria-hidden />
                    <span className="hidden sm:inline">Group</span>
                  </Button>
                  <Button type="button" size="sm" variant="premium" onClick={() => setShowNewMessage(true)}>
                    <MessageSquarePlus className="size-4" aria-hidden />
                    New
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={openCommunity}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition hover:bg-muted/30",
                  activeThread.kind === "community" && "bg-accent/10",
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <MessagesSquare className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">Community lounge</p>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      {communityLive ? <Wifi className="size-3 text-accent" /> : <WifiOff className="size-3" />}
                      {onlineLabel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {communityMessages[communityMessages.length - 1]?.body ?? "Public member channel"}
                  </p>
                </div>
              </button>

              {groups.length > 0 ? (
                <div className="border-b border-border/40 px-4 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Groups</p>
                </div>
              ) : null}

              {groups.length > 0 ? (
                <ul>
                  {groups.map((group) => (
                    <li key={group.id}>
                      <button
                        type="button"
                        onClick={() => openGroup(group.id)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition hover:bg-muted/30",
                          activeThread.kind === "group" &&
                            activeThread.groupId === group.id &&
                            "bg-accent/10",
                        )}
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
                          <Users className="size-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{group.name}</p>
                            {group.lastMessage ? (
                              <time className="shrink-0 text-[11px] text-muted-foreground">
                                {formatTime(group.lastMessage.createdAt)}
                              </time>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {group.lastMessage?.body ?? `${group.memberCount} members`}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="border-b border-border/40 px-4 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Private
                </p>
              </div>

              {conversations.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No private chats yet.
                  <br />
                  Tap <span className="font-medium text-foreground">New</span> to message someone.
                </p>
              ) : (
                <ul>
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => openDirect(conversation.id)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left transition hover:bg-muted/30",
                          activeThread.kind === "direct" &&
                            activeThread.conversationId === conversation.id &&
                            "bg-accent/10",
                        )}
                      >
                        <UserAvatar
                          name={conversation.peer.name}
                          email={null}
                          image={conversation.peer.image}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {conversation.peer.name ?? "Member"}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              {conversation.unreadCount > 0 ? (
                                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                                  {conversation.unreadCount}
                                </span>
                              ) : null}
                              {conversation.lastMessage ? (
                                <time className="text-[11px] text-muted-foreground">
                                  {formatTime(conversation.lastMessage.createdAt)}
                                </time>
                              ) : null}
                            </div>
                          </div>
                          <p
                            className={cn(
                              "mt-1 truncate text-xs",
                              conversation.unreadCount > 0
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {conversation.lastMessage?.body ?? "Start the conversation"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col bg-background/20",
              !mobileShowThread ? "hidden md:flex" : "flex",
            )}
          >
            <header className="flex items-center gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileShowThread(false)}
                aria-label="Back to inbox"
              >
                <ChevronLeft className="size-5" />
              </Button>

              {activeThread.kind === "direct" && selectedConversation ? (
                <UserAvatar
                  name={selectedConversation.peer.name}
                  email={null}
                  image={selectedConversation.peer.image}
                  size="sm"
                />
              ) : activeThread.kind === "group" ? (
                <div className="flex size-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
                  <Users className="size-4" aria-hidden />
                </div>
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Users className="size-4" aria-hidden />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{threadTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{threadSubtitle}</p>
              </div>

              {activeThread.kind === "direct" && selectedConversation ? (
                <ConversationActionsMenu
                  peerId={selectedConversation.peer.id}
                  peerName={selectedConversation.peer.name ?? "Member"}
                  signedIn
                />
              ) : null}
            </header>

            {activeThread.kind === "community" ? (
              <>
                <div ref={communityScrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4">
                  {communityLoading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Loading messages…
                    </div>
                  ) : null}

                  {!communityLoading && communityMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello to the community.
                    </p>
                  ) : null}

                  {communityMessages.map((message, index) => {
                    const mine = message.user.id === session.user.id;
                    const previous = communityMessages[index - 1];
                    const grouped = previous?.user.id === message.user.id;

                    return (
                      <ChatMessageBubble
                        key={message.id}
                        body={message.body}
                        createdAt={message.createdAt}
                        mine={mine}
                        senderName={message.user.name ?? "Member"}
                        senderImage={message.user.image}
                        senderRole={message.user.role}
                        showSender={!grouped}
                        canDelete={staff}
                        deleting={deletingCommunityId === message.id}
                        onDelete={() => handleDeleteCommunityMessage(message.id)}
                      />
                    );
                  })}
                </div>

                <MessageComposer
                  id="community-chat-input"
                  value={communityDraft}
                  onChange={setCommunityDraft}
                  onSubmit={handleCommunitySubmit}
                  pending={communityPending}
                  error={communityError}
                  placeholder="Message the community…"
                />
              </>
            ) : activeThread.kind === "group" && selectedGroup ? (
              <>
                <div ref={groupScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
                  {groupLoading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Loading messages…
                    </div>
                  ) : null}

                  {!groupLoading && groupMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello to {selectedGroup.name}.
                    </p>
                  ) : null}

                  {groupMessages.map((message, index) => {
                    const mine = message.sender.id === session.user.id;
                    const previous = groupMessages[index - 1];
                    const grouped = previous?.sender.id === message.sender.id;

                    return (
                      <ChatMessageBubble
                        key={message.id}
                        body={message.body}
                        createdAt={message.createdAt}
                        mine={mine}
                        senderName={mine ? "You" : (message.sender.name ?? "Member")}
                        senderImage={message.sender.image}
                        senderRole={message.sender.role}
                        showSender={!grouped}
                        canDelete={false}
                        deleting={false}
                        onDelete={() => undefined}
                      />
                    );
                  })}
                </div>

                <MessageComposer
                  id="group-chat-input"
                  value={groupDraft}
                  onChange={setGroupDraft}
                  onSubmit={handleGroupSubmit}
                  pending={groupPending}
                  error={groupError}
                  placeholder={`Message ${selectedGroup.name}…`}
                />
              </>
            ) : activeThread.kind === "direct" && selectedConversation ? (
              <>
                <div ref={directScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
                  {directLoading ? (
                    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      Loading messages…
                    </div>
                  ) : null}

                  {!directLoading && directMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No messages yet. Send the first message to {selectedConversation.peer.name ?? "this member"}.
                    </p>
                  ) : null}

                  {directMessages.map((message, index) => {
                    const mine = message.sender.id === session.user.id;
                    const previous = directMessages[index - 1];
                    const grouped = previous?.sender.id === message.sender.id;

                    return (
                      <ChatMessageBubble
                        key={message.id}
                        body={message.body}
                        createdAt={message.createdAt}
                        mine={mine}
                        senderName={mine ? "You" : (message.sender.name ?? "Member")}
                        senderImage={message.sender.image}
                        senderRole={message.sender.role}
                        showSender={!grouped}
                        canDelete={staff}
                        deleting={deletingDirectId === message.id}
                        onDelete={() => handleDeleteDirectMessage(message.id)}
                      />
                    );
                  })}
                </div>

                <MessageComposer
                  id="direct-chat-input"
                  value={directDraft}
                  onChange={setDirectDraft}
                  onSubmit={handleDirectSubmit}
                  pending={directPending}
                  error={directError}
                  placeholder={`Message ${selectedConversation.peer.name ?? "member"}…`}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Select a conversation from your inbox, or start a new message.
              </div>
            )}
          </div>
        </div>
      </section>

      <NewMessageDialog
        open={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onSelectMember={startConversation}
      />

      <CreateGroupDialog
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(groupId) => {
          void fetch("/api/chat/groups")
            .then((response) => response.json())
            .then((payload: { groups?: MemberGroupPayload[] }) => {
              setGroups(payload.groups ?? []);
              openGroup(groupId);
            })
            .catch(() => openGroup(groupId));
        }}
      />
    </>
  );
}

function MessageComposer({
  id,
  value,
  onChange,
  onSubmit,
  pending,
  error,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  error: string | null;
  placeholder: string;
}) {
  return (
    <form onSubmit={onSubmit} className="border-t border-border/60 bg-background/70 px-3 py-3 sm:px-4">
      {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
      <div className="flex items-end gap-2">
        <label htmlFor={id} className="sr-only">
          Message
        </label>
        <textarea
          id={id}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          maxLength={2000}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-2xl border border-border bg-background/80 px-4 py-2.5 text-sm outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/20"
        />
        <Button type="submit" variant="premium" size="icon" className="size-11 shrink-0" disabled={pending || !value.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" />}
        </Button>
      </div>
      <p className="mt-2 hidden text-[11px] text-muted-foreground sm:block">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
