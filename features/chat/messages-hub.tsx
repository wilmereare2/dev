"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import {
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  Plus,
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
import { ChatHeader } from "@/features/chat/messages/chat-header";
import { ConversationItem } from "@/features/chat/messages/conversation-item";
import { EmptyState } from "@/features/chat/messages/empty-state";
import { ConversationListSkeleton } from "@/features/chat/messages/loading-skeleton";
import { MessageNav, type InboxFilter } from "@/features/chat/messages/message-nav";
import { VisibilityBadge } from "@/features/chat/messages/visibility-badge";
import { formatMemberCount, formatMessageTimestamp } from "@/features/chat/chat-format";
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
  return formatMessageTimestamp(iso);
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

const INBOX_WIDTH_KEY = "messages-inbox-width";
const INBOX_MIN_WIDTH = 56;
const INBOX_MAX_WIDTH = 360;
const INBOX_DEFAULT_WIDTH = 300;
const INBOX_ICON_ONLY_WIDTH = 72;
const INBOX_ICON_ONLY_THRESHOLD = 96;
const NAV_WIDTH = 220;

export function MessagesHub({ session }: MessagesHubProps) {
  const searchParams = useSearchParams();
  const staff = isStaff(session.user.role);
  const [activeThread, setActiveThread] = useState<ActiveThread>({ kind: "community" });
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [inboxWidth, setInboxWidth] = useState(INBOX_DEFAULT_WIDTH);
  const inboxWidthRef = useRef(INBOX_DEFAULT_WIDTH);
  const inboxResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [inboxResizable, setInboxResizable] = useState(false);

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
  const [communityLoadError, setCommunityLoadError] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
  const [directLoadError, setDirectLoadError] = useState<string | null>(null);
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
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setInboxResizable(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INBOX_WIDTH_KEY);
      if (!stored) return;
      const parsed = Number(stored);
      if (!Number.isFinite(parsed)) return;
      const next = Math.min(INBOX_MAX_WIDTH, Math.max(INBOX_MIN_WIDTH, parsed));
      setInboxWidth(next);
      inboxWidthRef.current = next;
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    inboxWidthRef.current = inboxWidth;
  }, [inboxWidth]);

  function startInboxResize(event: React.PointerEvent<HTMLDivElement>) {
    inboxResizeRef.current = { startX: event.clientX, startWidth: inboxWidthRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveInboxResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!inboxResizeRef.current) return;
    const next = Math.min(
      INBOX_MAX_WIDTH,
      Math.max(INBOX_MIN_WIDTH, inboxResizeRef.current.startWidth + (event.clientX - inboxResizeRef.current.startX)),
    );
    setInboxWidth(next);
  }

  function endInboxResize(event: React.PointerEvent<HTMLDivElement>) {
    if (!inboxResizeRef.current) return;
    inboxResizeRef.current = null;

    const width = inboxWidthRef.current;
    if (width < INBOX_ICON_ONLY_THRESHOLD) {
      const snapped = INBOX_ICON_ONLY_WIDTH;
      setInboxWidth(snapped);
      inboxWidthRef.current = snapped;
    }

    try {
      localStorage.setItem(INBOX_WIDTH_KEY, String(inboxWidthRef.current));
    } catch {
      /* ignore */
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

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
    setGroupsLoading(true);
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
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const response = await fetch("/api/chat/direct/conversations");
      const payload = (await response.json()) as { conversations?: DirectConversationPayload[] };
      setConversations(payload.conversations ?? []);
    } catch {
      /* ignore */
    } finally {
      setConversationsLoading(false);
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
      setCommunityLoadError(null);
      try {
        const response = await fetch("/api/chat/messages");
        const payload = (await response.json()) as { messages?: ChatMessagePayload[]; error?: string };
        if (!response.ok) {
          setCommunityLoadError(payload.error ?? "Could not load community chat.");
          return;
        }
        if (cancelled) return;
        replaceCommunityMessages(payload.messages ?? []);
        window.requestAnimationFrame(() => scrollCommunityToBottom(false));
      } catch {
        if (!cancelled) setCommunityLoadError("Could not load community chat.");
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
      setConversationsLoading(true);
      try {
        const response = await fetch("/api/chat/direct/conversations");
        const payload = (await response.json()) as {
          conversations?: DirectConversationPayload[];
        };
        if (!response.ok || cancelled) return;
        setConversations(payload.conversations ?? []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setConversationsLoading(false);
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
    setDirectLoadError(null);
    setDirectError(null);

    fetch(`/api/chat/direct/conversations/${activeConversationId}/messages`)
      .then((response) => response.json())
      .then((payload: { messages?: DirectMessagePayload[]; error?: string }) => {
        if (cancelled) return;
        if (payload.error) {
          setDirectLoadError(payload.error);
          return;
        }
        const messages = payload.messages ?? [];
        setDirectMessages(messages);
        directLastIdRef.current = messages[messages.length - 1]?.id ?? null;
        window.requestAnimationFrame(() => scrollDirectToBottom(false));
      })
      .catch(() => {
        if (!cancelled) setDirectLoadError("Could not load private messages.");
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
    setGroupLoadError(null);
    setGroupError(null);

    fetch(`/api/chat/groups/${activeGroupId}/messages`)
      .then((response) => response.json())
      .then((payload: { messages?: GroupMessagePayload[]; error?: string }) => {
        if (cancelled) return;
        if (payload.error) {
          setGroupLoadError(payload.error);
          return;
        }
        const messages = payload.messages ?? [];
        setGroupMessages(messages);
        groupLastIdRef.current = messages[messages.length - 1]?.id ?? null;
        window.requestAnimationFrame(() => scrollGroupToBottom(false));
      })
      .catch(() => {
        if (!cancelled) setGroupLoadError("Could not load group messages.");
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
        ? `${onlineLabel} · Public`
        : "Reconnecting…"
      : activeThread.kind === "group"
        ? selectedGroup
          ? `${formatMemberCount(selectedGroup.memberCount)} · ${selectedGroup.visibility === "public" ? "Public" : "Private"}${selectedGroup.archivedAt ? " · Archived" : ""}`
          : "Group chat"
        : "Private message";

  const reloadCommunity = useCallback(async () => {
    setCommunityLoading(true);
    setCommunityLoadError(null);
    try {
      const response = await fetch("/api/chat/messages");
      const payload = (await response.json()) as { messages?: ChatMessagePayload[]; error?: string };
      if (!response.ok) {
        setCommunityLoadError(payload.error ?? "Could not load community chat.");
        return;
      }
      replaceCommunityMessages(payload.messages ?? []);
    } catch {
      setCommunityLoadError("Could not load community chat.");
    } finally {
      setCommunityLoading(false);
    }
  }, [replaceCommunityMessages]);

  const showCommunityInList = inboxFilter === "all";
  const showGroupsInList = inboxFilter === "all" || inboxFilter === "groups";
  const showPrivateInList = inboxFilter === "all" || inboxFilter === "private";

  useEffect(() => {
    setSearchOpen(false);
    setMessageSearch("");
  }, [activeThread]);

  const handleSearchToggle = useCallback(() => {
    setSearchOpen((open) => {
      if (open) setMessageSearch("");
      return !open;
    });
  }, []);

  const listLoading = conversationsLoading || groupsLoading;

  const communityListError = communityLoadError;
  const communityComposerError = communityError;

  const groupListError = groupLoadError;
  const groupComposerError = groupError;

  const directListError = directLoadError;
  const directComposerError = directError;

  const reloadGroupMessages = useCallback(async () => {
    if (activeThread.kind !== "group") return;
    setGroupLoading(true);
    setGroupLoadError(null);
    try {
      const response = await fetch(`/api/chat/groups/${activeThread.groupId}/messages`);
      const payload = (await response.json()) as { messages?: GroupMessagePayload[]; error?: string };
      if (payload.error) {
        setGroupLoadError(payload.error);
        return;
      }
      setGroupMessages(payload.messages ?? []);
    } catch {
      setGroupLoadError("Could not load group messages.");
    } finally {
      setGroupLoading(false);
    }
  }, [activeThread]);

  const reloadDirectMessages = useCallback(async () => {
    if (activeThread.kind !== "direct") return;
    setDirectLoading(true);
    setDirectLoadError(null);
    try {
      const response = await fetch(`/api/chat/direct/conversations/${activeThread.conversationId}/messages`);
      const payload = (await response.json()) as { messages?: DirectMessagePayload[]; error?: string };
      if (payload.error) {
        setDirectLoadError(payload.error);
        return;
      }
      setDirectMessages(payload.messages ?? []);
    } catch {
      setDirectLoadError("Could not load private messages.");
    } finally {
      setDirectLoading(false);
    }
  }, [activeThread]);

  const threadAvatar =
    activeThread.kind === "direct" && selectedConversation ? (
      <UserAvatar
        name={selectedConversation.peer.name}
        email={null}
        image={selectedConversation.peer.image}
        size="sm"
      />
    ) : activeThread.kind === "group" ? (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Users className="size-4" aria-hidden />
      </div>
    ) : (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Users className="size-4" aria-hidden />
      </div>
    );

  const threadActions =
    activeThread.kind === "direct" && selectedConversation ? (
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
    ) : null;

  const discoverablePublicGroups = useMemo(
    () => publicGroups.filter((group) => !groups.some((mine) => mine.id === group.id)),
    [groups, publicGroups],
  );

  const inboxIconOnly = inboxResizable && inboxWidth <= INBOX_ICON_ONLY_THRESHOLD;

  const messageNavActions = (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="w-full justify-start"
        onClick={() => setShowCreateGroup(true)}
      >
        <UserPlus className="size-4" aria-hidden />
        Create group
      </Button>
      <Button type="button" size="sm" variant="premium" className="w-full justify-start" onClick={() => setShowNewMessage(true)}>
        <MessageSquarePlus className="size-4" aria-hidden />
        New message
      </Button>
    </div>
  );

  return (
    <>
      <section className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 lg:px-6">
        <div className="flex h-[min(720px,calc(100dvh-var(--site-header-offset)-var(--site-bottom-offset)-6rem))] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 shadow-xl md:flex-row">
          <MessageNav
            filter={inboxFilter}
            onFilterChange={setInboxFilter}
            className="hidden shrink-0 lg:flex"
            style={{ width: NAV_WIDTH }}
            actions={messageNavActions}
          />

          <aside
            style={inboxResizable ? { width: inboxWidth } : undefined}
            className={cn(
              "flex w-full min-w-0 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background/40 md:transition-[width]",
              mobileShowThread ? "hidden md:flex" : "flex",
              inboxIconOnly && "items-center",
            )}
          >
            {!inboxIconOnly ? (
              <div className="flex h-14 w-full shrink-0 items-center border-b border-border/60 px-4">
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-display text-base font-semibold tracking-tight">Conversations</h1>
                  <p className="truncate text-xs text-muted-foreground">Recent chats</p>
                </div>
                <div className="ml-2 flex shrink-0 gap-1 lg:hidden">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-9 shrink-0"
                    onClick={() => setShowCreateGroup(true)}
                    aria-label="Create group"
                  >
                    <UserPlus className="size-4" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="premium"
                    className="size-9 shrink-0"
                    onClick={() => setShowNewMessage(true)}
                    aria-label="New message"
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}

            {!inboxIconOnly ? (
              <MessageNav filter={inboxFilter} onFilterChange={setInboxFilter} layout="tabs" className="lg:hidden" />
            ) : null}

            <div className={cn("min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden", inboxIconOnly && "px-1 py-2")}>
              {!inboxIconOnly ? (
                <p className="sticky top-0 z-[1] border-b border-border/40 bg-background/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                  Recent
                </p>
              ) : null}

              {listLoading && !inboxIconOnly ? <ConversationListSkeleton /> : null}
              {listLoading && inboxIconOnly ? (
                <ul className="flex flex-col items-center gap-2 py-2" aria-hidden>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <li key={index} className="size-10 animate-pulse rounded-full bg-muted/50" />
                  ))}
                </ul>
              ) : null}

              {!listLoading && showCommunityInList ? (
                <div className={cn(inboxIconOnly ? "w-full" : "px-2 py-1")}>
                  <ConversationItem
                    active={activeThread.kind === "community"}
                    onClick={openCommunity}
                    iconOnly={inboxIconOnly}
                    icon={
                      <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <MessagesSquare className="size-5" aria-hidden />
                      </div>
                    }
                    title="Community lounge"
                    preview={communityMessages[communityMessages.length - 1]?.body ?? "Public member channel"}
                    meta={
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {communityLive ? <Wifi className="size-3 text-accent" /> : <WifiOff className="size-3" />}
                        {onlineLabel}
                      </span>
                    }
                  />
                </div>
              ) : null}

              {!listLoading && showGroupsInList && groups.length > 0 ? (
                <ul className={cn("space-y-0.5", inboxIconOnly ? "w-full py-1" : "px-2 py-1")}>
                  {groups.map((group) => (
                    <li key={group.id}>
                      <ConversationItem
                        active={activeThread.kind === "group" && activeThread.groupId === group.id}
                        onClick={() => openGroup(group.id)}
                        iconOnly={inboxIconOnly}
                        icon={
                          <div className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                            <Users className="size-5" aria-hidden />
                          </div>
                        }
                        title={group.name}
                        preview={group.lastMessage?.body ?? formatMemberCount(group.memberCount)}
                        time={group.lastMessage ? formatTime(group.lastMessage.createdAt) : undefined}
                        badge={<VisibilityBadge visibility={group.visibility} />}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              {!listLoading && showGroupsInList && !inboxIconOnly && discoverablePublicGroups.length > 0 ? (
                <>
                  <p className="border-t border-border/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Discover
                  </p>
                  <ul className="space-y-0.5 px-2 py-1">
                    {discoverablePublicGroups.map((group) => (
                      <li key={group.id}>
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-muted/35">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                            <Users className="size-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{group.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {formatMemberCount(group.memberCount)} · Open to join
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

              {!listLoading && showPrivateInList ? (
                conversations.length > 0 ? (
                  <ul className={cn("space-y-0.5", inboxIconOnly ? "w-full py-1" : "px-2 py-1")}>
                    {conversations.map((conversation) => (
                      <li key={conversation.id}>
                        <ConversationItem
                          active={
                            activeThread.kind === "direct" &&
                            activeThread.conversationId === conversation.id
                          }
                          onClick={() => openDirect(conversation.id)}
                          iconOnly={inboxIconOnly}
                          icon={
                            <UserAvatar
                              name={conversation.peer.name}
                              email={null}
                              image={conversation.peer.image}
                              size="md"
                            />
                          }
                          title={conversation.peer.name ?? "Member"}
                          preview={conversation.lastMessage?.body ?? "Start the conversation"}
                          time={
                            conversation.lastMessage
                              ? formatTime(conversation.lastMessage.createdAt)
                              : undefined
                          }
                          unreadCount={conversation.unreadCount}
                        />
                      </li>
                    ))}
                  </ul>
                ) : inboxFilter === "private" && !inboxIconOnly ? (
                  <EmptyState
                    title="No conversations yet"
                    description="Start a conversation to see it here."
                  />
                ) : null
              ) : null}

              {!listLoading && !inboxIconOnly && inboxFilter === "groups" && groups.length === 0 && discoverablePublicGroups.length === 0 ? (
                <EmptyState
                  title="No groups yet"
                  description="Create a group or join a public one to get started."
                />
              ) : null}
            </div>
          </aside>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={inboxIconOnly ? "Expand conversation list" : "Resize conversation list"}
            onPointerDown={startInboxResize}
            onPointerMove={moveInboxResize}
            onPointerUp={endInboxResize}
            onPointerCancel={endInboxResize}
            className="relative z-0 hidden shrink-0 cursor-col-resize bg-border/40 transition hover:bg-accent/40 md:block md:w-1.5"
          />

          <div
            className={cn(
              "relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background/20",
              !mobileShowThread ? "hidden md:flex" : "flex",
            )}
          >
            <ChatHeader
              title={threadTitle}
              subtitle={threadSubtitle}
              avatar={threadAvatar}
              onBack={() => setMobileShowThread(false)}
              actions={threadActions}
              searchOpen={searchOpen}
              searchQuery={messageSearch}
              onSearchToggle={handleSearchToggle}
              onSearchChange={setMessageSearch}
              onSearchClear={() => setMessageSearch("")}
            />

            <div className="flex min-h-0 flex-1 flex-col">
              {activeThread.kind === "community" ? (
                <>
                  <ChatMessageList
                    messages={toCommunityMessages(communityMessages)}
                    currentUserId={session.user.id}
                    scrollRef={communityScrollRef}
                    loading={communityLoading}
                    error={communityListError}
                    onRetry={() => void reloadCommunity()}
                    emptyTitle="No messages yet"
                    emptyDescription="Say hello to the community."
                    showSenderNames
                    canDelete={staff}
                    deletingId={deletingCommunityId}
                    onDelete={handleDeleteCommunityMessage}
                    searchQuery={messageSearch}
                  />

                  <ChatComposer
                    id="community-chat-input"
                    value={communityDraft}
                    onChange={setCommunityDraft}
                    onSubmit={handleCommunitySubmit}
                    pending={communityPending}
                    error={communityComposerError}
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
                    error={groupListError}
                    onRetry={() => void reloadGroupMessages()}
                    emptyTitle="No messages yet"
                    emptyDescription={`Say hello to ${selectedGroup.name}.`}
                    showSenderNames
                    searchQuery={messageSearch}
                  />

                  <ChatComposer
                    id="group-chat-input"
                    value={groupDraft}
                    onChange={setGroupDraft}
                    onSubmit={handleGroupSubmit}
                    pending={groupPending}
                    error={groupComposerError}
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
                    error={directListError}
                    onRetry={() => void reloadDirectMessages()}
                    emptyTitle="No messages yet"
                    emptyDescription={`Send the first message to ${selectedConversation.peer.name ?? "this member"}.`}
                    showReadStatus
                    canDelete={staff}
                    deletingId={deletingDirectId}
                    onDelete={handleDeleteDirectMessage}
                    searchQuery={messageSearch}
                  />

                  <ChatComposer
                    id="direct-chat-input"
                    value={directDraft}
                    onChange={setDirectDraft}
                    onSubmit={handleDirectSubmit}
                    pending={directPending}
                    error={directComposerError}
                    placeholder={`Message ${selectedConversation.peer.name ?? "member"}…`}
                  />
                </>
              ) : (
                <EmptyState
                  title="Select a conversation"
                  description="Choose a chat from your list, or start a new message."
                  className="flex-1"
                />
              )}
            </div>
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
