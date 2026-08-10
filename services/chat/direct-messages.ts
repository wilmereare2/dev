import { prisma } from "@/lib/db/prisma";
import { createUserNotification } from "@/services/user/notifications";
import type {
  DirectConversationPayload,
  DirectMessagePayload,
  MemberSummaryPayload,
} from "@/lib/chat/constants";
import { MEMBER_CHAT_CHANNEL_SLUG } from "@/lib/chat/constants";

const userSelect = { id: true, name: true, image: true, role: true } as const;

function pairUserIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function serializeUser(user: {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

function serializeDirectMessage(message: {
  id: string;
  body: string;
  createdAt: Date;
  sender: { id: string; name: string | null; image: string | null; role: string };
}): DirectMessagePayload {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: serializeUser(message.sender),
  };
}

async function isBlocked(userA: string, userB: string) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(block);
}

export async function userInConversation(conversationId: string, userId: string) {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
    select: { userLowId: true, userHighId: true },
  });
  if (!conversation) return false;
  return conversation.userLowId === userId || conversation.userHighId === userId;
}

export async function listDirectConversations(userId: string): Promise<DirectConversationPayload[]> {
  const conversations = await prisma.directConversation.findMany({
    where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      userLow: { select: userSelect },
      userHigh: { select: userSelect },
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
  });

  return conversations.map((conversation) => {
    const peer =
      conversation.userLowId === userId ? conversation.userHigh : conversation.userLow;
    const last = conversation.messages[0];

    return {
      id: conversation.id,
      updatedAt: conversation.updatedAt.toISOString(),
      peer: serializeUser(peer),
      lastMessage: last ? serializeDirectMessage(last) : null,
    };
  });
}

export async function getOrCreateDirectConversation(userId: string, peerId: string) {
  if (userId === peerId) {
    return { ok: false as const, error: "You cannot message yourself." };
  }

  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: userSelect,
  });
  if (!peer) {
    return { ok: false as const, error: "Member not found." };
  }

  if (await isBlocked(userId, peerId)) {
    return { ok: false as const, error: "Messaging is not available for this member." };
  }

  const [userLowId, userHighId] = pairUserIds(userId, peerId);
  const conversation = await prisma.directConversation.upsert({
    where: { userLowId_userHighId: { userLowId, userHighId } },
    create: { userLowId, userHighId },
    update: {},
    include: {
      userLow: { select: userSelect },
      userHigh: { select: userSelect },
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        include: { sender: { select: userSelect } },
      },
    },
  });

  const peerUser = conversation.userLowId === userId ? conversation.userHigh : conversation.userLow;
  const last = conversation.messages[0];

  return {
    ok: true as const,
    conversation: {
      id: conversation.id,
      updatedAt: conversation.updatedAt.toISOString(),
      peer: serializeUser(peerUser),
      lastMessage: last ? serializeDirectMessage(last) : null,
    } satisfies DirectConversationPayload,
  };
}

export async function listDirectMessages(conversationId: string, userId: string, limit = 50) {
  const allowed = await userInConversation(conversationId, userId);
  if (!allowed) {
    return { ok: false as const, error: "Conversation not found." };
  }

  const take = Math.min(Math.max(limit, 1), 100);
  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: { sender: { select: userSelect } },
  });

  return {
    ok: true as const,
    messages: messages.reverse().map(serializeDirectMessage),
  };
}

export async function listDirectMessagesSince(
  conversationId: string,
  userId: string,
  afterId?: string | null,
) {
  const allowed = await userInConversation(conversationId, userId);
  if (!allowed) return [];

  if (!afterId) return [];

  const cursor = await prisma.directMessage.findUnique({
    where: { id: afterId },
    select: { createdAt: true, conversationId: true },
  });
  if (!cursor || cursor.conversationId !== conversationId) return [];

  const messages = await prisma.directMessage.findMany({
    where: {
      conversationId,
      OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: afterId } }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 50,
    include: { sender: { select: userSelect } },
  });

  return messages.map(serializeDirectMessage);
}

export async function createDirectMessage(conversationId: string, userId: string, body: string) {
  const allowed = await userInConversation(conversationId, userId);
  if (!allowed) {
    return { ok: false as const, error: "Conversation not found." };
  }

  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
    select: { userLowId: true, userHighId: true },
  });
  if (!conversation) {
    return { ok: false as const, error: "Conversation not found." };
  }

  const peerId = conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId;
  if (await isBlocked(userId, peerId)) {
    return { ok: false as const, error: "Messaging is not available for this member." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Message cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { ok: false as const, error: "Message is too long (max 2000 characters)." };
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        body: trimmed,
      },
      include: { sender: { select: userSelect } },
    });

    await tx.directConversation.update({
      where: { id: conversationId },
      data: { updatedAt: created.createdAt },
    });

    return created;
  });

  const senderName = message.sender.name ?? "A member";
  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;

  await createUserNotification({
    userId: peerId,
    type: "direct_message",
    title: `New message from ${senderName}`,
    body: preview,
    href: `/messages?conversation=${conversationId}`,
    respectPushSetting: true,
  });

  return { ok: true as const, message: serializeDirectMessage(message) };
}

export async function deleteDirectMessage(messageId: string) {
  const existing = await prisma.directMessage.findUnique({
    where: { id: messageId },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false as const, error: "Message not found." };
  }

  await prisma.directMessage.delete({ where: { id: messageId } });
  return { ok: true as const };
}

async function listKnownMemberIds(userId: string) {
  const known = new Set<string>();

  const conversations = await prisma.directConversation.findMany({
    where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
    select: { userLowId: true, userHighId: true },
  });
  for (const conversation of conversations) {
    known.add(conversation.userLowId === userId ? conversation.userHighId : conversation.userLowId);
  }

  const follows = await prisma.creatorFollow.findMany({
    where: { userId },
    select: { creatorId: true },
  });
  for (const follow of follows) {
    if (follow.creatorId !== userId) known.add(follow.creatorId);
  }

  const channel = await prisma.chatChannel.findUnique({
    where: { slug: MEMBER_CHAT_CHANNEL_SLUG },
    select: { id: true },
  });
  if (channel) {
    const loungePeers = await prisma.chatMessage.findMany({
      where: {
        channelId: channel.id,
        userId: { not: userId },
        channel: {
          messages: { some: { userId } },
        },
      },
      distinct: ["userId"],
      select: { userId: true },
      take: 50,
    });
    for (const peer of loungePeers) {
      known.add(peer.userId);
    }
  }

  known.delete(userId);
  return known;
}

export async function listKnownMembers(userId: string): Promise<MemberSummaryPayload[]> {
  const knownIds = await listKnownMemberIds(userId);
  if (!knownIds.size) return [];

  const members = await prisma.user.findMany({
    where: { id: { in: [...knownIds] } },
    select: userSelect,
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: 50,
  });

  return members.map((member) => ({
    ...serializeUser(member),
    known: true,
  }));
}

export async function searchMembers(
  userId: string,
  query: string,
  limit = 20,
): Promise<MemberSummaryPayload[]> {
  const take = Math.min(Math.max(limit, 1), 50);
  const trimmed = query.trim();
  const knownIds = await listKnownMemberIds(userId);

  const members = await prisma.user.findMany({
    where: {
      id: { not: userId },
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { email: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: userSelect,
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take,
  });

  return members.map((member) => ({
    ...serializeUser(member),
    known: knownIds.has(member.id),
  }));
}
