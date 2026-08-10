import { prisma } from "@/lib/db/prisma";
import { MEMBER_CHAT_CHANNEL_SLUG, type ChatMessagePayload } from "@/lib/chat/constants";

function serializeMessage(message: {
  id: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; role: string };
}): ChatMessagePayload {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    user: {
      id: message.user.id,
      name: message.user.name,
      image: message.user.image,
      role: message.user.role,
    },
  };
}

const userSelect = { id: true, name: true, image: true, role: true } as const;

export async function ensureMemberChatChannel() {
  return prisma.chatChannel.upsert({
    where: { slug: MEMBER_CHAT_CHANNEL_SLUG },
    create: {
      id: MEMBER_CHAT_CHANNEL_SLUG,
      slug: MEMBER_CHAT_CHANNEL_SLUG,
      name: "Member Lounge",
      description: "Real-time community chat for verified manuelaX members.",
      adminOnly: false,
    },
    update: {},
  });
}

export async function getRecentChatMessages(limit = 50) {
  const channel = await ensureMemberChatChannel();
  const take = Math.min(Math.max(limit, 1), 100);
  const messages = await prisma.chatMessage.findMany({
    where: { channelId: channel.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: { user: { select: userSelect } },
  });

  return messages.reverse().map(serializeMessage);
}

export async function listChatMessagesSince(afterId?: string | null) {
  const channel = await ensureMemberChatChannel();
  if (!afterId) return [];

  const cursor = await prisma.chatMessage.findUnique({
    where: { id: afterId },
    select: { createdAt: true, channelId: true },
  });

  if (!cursor || cursor.channelId !== channel.id) return [];

  const messages = await prisma.chatMessage.findMany({
    where: {
      channelId: channel.id,
      OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: afterId } }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 50,
    include: { user: { select: userSelect } },
  });

  return messages.map(serializeMessage);
}

export async function createChatMessage(userId: string, body: string) {
  const channel = await ensureMemberChatChannel();
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Message cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { ok: false as const, error: "Message is too long (max 2000 characters)." };
  }

  const message = await prisma.chatMessage.create({
    data: {
      channelId: channel.id,
      userId,
      body: trimmed,
    },
    include: { user: { select: userSelect } },
  });

  return { ok: true as const, message: serializeMessage(message) };
}

export async function deleteChatMessage(messageId: string) {
  const channel = await ensureMemberChatChannel();
  const existing = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, channelId: true },
  });

  if (!existing || existing.channelId !== channel.id) {
    return { ok: false as const, error: "Message not found." };
  }

  await prisma.chatMessage.delete({ where: { id: messageId } });
  return { ok: true as const };
}

export async function syncRecentChatMessages(limit = 50) {
  return getRecentChatMessages(limit);
}
