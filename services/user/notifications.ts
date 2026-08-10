import { prisma } from "@/lib/db/prisma";

export async function listNotifications(userId: string, limit = 20, offset = 0) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countNotifications(userId: string) {
  return prisma.notification.count({ where: { userId } });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const record = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!record) return null;

  return prisma.notification.update({
    where: { id: record.id },
    data: { readAt: record.readAt ?? new Date() },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markConversationNotificationsRead(userId: string, conversationId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      type: "direct_message",
      href: `/messages?conversation=${conversationId}`,
    },
    data: { readAt: new Date() },
  });
}

export async function createUserNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  respectPushSetting?: boolean;
}) {
  if (input.respectPushSetting) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: input.userId },
      select: { pushNotifications: true },
    });
    if (settings && !settings.pushNotifications) return null;
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
  });
}
