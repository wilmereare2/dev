import { prisma } from "@/lib/db/prisma";

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
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
