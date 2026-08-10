"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import {
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import { ChatComposer } from "@/features/chat/chat-composer";
import type { ChatListMessage } from "@/features/chat/chat-message-list";
import { ChatMessageList } from "@/features/chat/chat-message-list";
import { ConversationActionsMenu } from "@/features/chat/conversation-actions-menu";
import { CreateGroupDialog } from "@/features/chat/create-group-dialog";
import { GroupActionsMenu } from "@/features/chat/group-actions-menu";
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

function toCommunityMessages(messages: ChatMessagePayload[]): ChatListMessage[] {
  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    senderId: message.user.id,
    senderName: message.user.name ?? "Member",
    senderImage: message.user.image,
    senderRole: message.user.role,
  }));
}

function toGroupMessages(messages: GroupMessagePayload[], currentUserId: string): ChatListMessage[] {
  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    senderId: message.sender.id,
    senderName: message.sender.id === currentUserId ? "You" : (message.sender.name ?? "Member"),
    senderImage: message.sender.image,
    senderRole: message.sender.role,
  }));
}

function toDirectMessages(messages: DirectMessagePayload[], currentUserId: string): ChatListMessage[] {
  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt,
    senderId: message.sender.id,
    senderName: message.sender.id === currentUserId ? "You" : (message.sender.name ?? "Member"),
    senderImage: message.sender.image,
    senderRole: message.sender.role,
    readAt: message.readAt,
  }));
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
  const [publicGroups, setPublicGroups] = useState<MemberGroupPayload[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessagePayload[]>([]);
  const [groupDraft, setGroupDraft] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupPending, setGroupPending] = useState(false);
  const [joinGroupPendingId, setJoinGroupPendingId] = useState<string | null>(null);
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

  const scrollCommunityToBottom = useCallback((force = false) => {
    const node = communityScrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
    if (force || nearBottom) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  const scrollDirectToBottom = useCallback((force = false) => {
    const node = directScrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
    if (force || nearBottom) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  const scrollGroupToBottom = useCallback((force = false) => {
    const node = groupScrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
    if (force || nearBottom) {
      node.scrollTop = node.scrollHeight;
    }
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

  const refreshGroups = useCallback(async () => {
    try {
      const [mineResponse, discoverResponse] = await Promise.all([
        fetch("/api/chat/groups"),
        fetch("/api/chat/groups?discover=1"),
      ]);
      const minePayload = (await mineResponse.json()) as { groups?: MemberGroupPayload[] };
      const discoverPayload = (await discoverResponse.json()) as { groups?: MemberGroupPayload[] };
      setGroups(minePayload.groups ?? []);
      setPublicGroups(discoverPayload.groups ?? []);
    } catch {
      /* ignore */
    }
  }, []);

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
        window.requestAnimationFrame(() => scrollCommunityToBottom(false));
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
          window.requestAnimationFrame(() => scrollCommunityToBottom(true));
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
      await refreshGroups();
    }

    if (!cancelled) {
      void loadGroups();
    }
    return () => {
      cancelled = true;
    };
  }, [refreshGroups]);

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
        window.requestAnimationFrame(() => scrollDirectToBottom(false));
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
      fetch(`/api/chat/direct/conversations/${activeConversationId}/messages`)
        .then((response) => response.json())
        .then((payload: { messages?: DirectMessagePayload[] }) => {
          const messages = payload.messages ?? [];
          setDirectMessages(messages);
          directLastIdRef.current = messages[messages.length - 1]?.id ?? null;
          window.requestAnimationFrame(() => scrollDirectToBottom(false));
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
        window.requestAnimationFrame(() => scrollGroupToBottom(false));
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
          window.requestAnimationFrame(() => scrollGroupToBottom(false));
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

  async function joinPublicGroup(groupId: string) {
    if (joinGroupPendingId) return;

    setJoinGroupPendingId(groupId);
    setGroupError(null);

    try {
      const response = await fetch(`/api/chat/groups/${groupId}`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setGroupError(payload.error ?? "Could not join group.");
        return;
      }

      await refreshGroups();
      openGroup(groupId);
    } catch {
      setGroupError("Could not join group.");
    } finally {
      setJoinGroupPendingId(null);
    }
  }

  function handleGroupArchivedChange() {
    void refreshGroups().then(() => {
      if (activeThread.kind === "group") {
        setActiveThread({ kind: "community" });
        setMobileShowThread(false);
      }
    });
  }

  function handleGroupMembersChange() {
    void refreshGroups();
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
        window.requestAnimationFrame(() => scrollGroupToBottom(true));
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
        window.requestAnimationFrame(() => scrollCommunityToBottom(true));
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
        window.requestAnimationFrame(() => scrollDirectToBottom(true));
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
        ? selectedGroup
          ? `${selectedGroup.memberCount} members · ${selectedGroup.visibility === "public" ? "Public" : "Private"}${selectedGroup.myRole === "creator" ? " · You are creator" : selectedGroup.myRole === "admin" ? " · You are admin" : ""}${selectedGroup.archivedAt ? " · Archived" : ""}`
          : "Group chat"
        : "Private message";

  const discoverablePublicGroups = useMemo(
    () => publicGroups.filter((group) => !groups.some((mine) => mine.id === group.id)),
    [groups, publicGroups],
  );

  return (
    <>
      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-4 lg:px-6">
        <div className="flex h-[min(720px,calc(100dvh-var(--site-header-offset)-var(--site-bottom-offset)-6rem))] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 shadow-xl md:flex-row">
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
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  group.visibility === "public"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {group.visibility}
                              </span>
                              {group.lastMessage ? (
                                <time className="text-[11px] text-muted-foreground">
                                  {formatTime(group.lastMessage.createdAt)}
                                </time>
                              ) : null}
                            </div>
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

              {discoverablePublicGroups.length > 0 ? (
                <>
                  <div className="border-b border-border/40 px-4 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Public groups
                    </p>
                  </div>
                  <ul>
                    {discoverablePublicGroups.map((group) => (
                      <li key={group.id}>
                        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                            <Users className="size-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{group.name}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {group.memberCount} members · Open to join
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={joinGroupPendingId === group.id}
                            onClick={() => void joinPublicGroup(group.id)}
                          >
                            {joinGroupPendingId === group.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              "Join"
                            )}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
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
              "flex min-h-0 min-w-0 flex-1 flex-col bg-background/20",
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
              ) : activeThread.kind === "group" && selectedGroup ? (
                <GroupActionsMenu
                  groupId={selectedGroup.id}
                  groupName={selectedGroup.name}
                  myRole={selectedGroup.myRole}
                  archived={Boolean(selectedGroup.archivedAt)}
                  onArchivedChange={handleGroupArchivedChange}
                  onMembersChange={handleGroupMembersChange}
                />
              ) : null}
            </header>

            {activeThread.kind === "community" ? (
              <>
                <ChatMessageList
                  messages={toCommunityMessages(communityMessages)}
                  currentUserId={session.user.id}
                  scrollRef={communityScrollRef}
                  loading={communityLoading}
                  emptyText="No messages yet. Say hello to the community."
                  showSenderNames
                  canDelete={staff}
                  deletingId={deletingCommunityId}
                  onDelete={handleDeleteCommunityMessage}
                />

                <ChatComposer
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
                <ChatMessageList
                  messages={toGroupMessages(groupMessages, session.user.id)}
                  currentUserId={session.user.id}
                  scrollRef={groupScrollRef}
                  loading={groupLoading}
                  emptyText={`No messages yet. Say hello to ${selectedGroup.name}.`}
                  showSenderNames
                />

                <ChatComposer
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
                <ChatMessageList
                  messages={toDirectMessages(directMessages, session.user.id)}
                  currentUserId={session.user.id}
                  scrollRef={directScrollRef}
                  loading={directLoading}
                  emptyText={`No messages yet. Send the first message to ${selectedConversation.peer.name ?? "this member"}.`}
                  showReadStatus
                  canDelete={staff}
                  deletingId={deletingDirectId}
                  onDelete={handleDeleteDirectMessage}
                />

                <ChatComposer
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
          void refreshGroups().then(() => openGroup(groupId));
        }}
      />
    </>
  );
}
