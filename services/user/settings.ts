import { prisma } from "@/lib/db/prisma";

export async function getUserSettings(userId: string) {
  return prisma.userSettings.findUnique({ where: { userId } });
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      settings: true,
    },
  });
}

export async function updateProfile(userId: string, data: { name?: string; bio?: string; image?: string }) {
  const { name, bio, image } = data;

  await prisma.$transaction([
    ...(name !== undefined || image !== undefined
      ? [
          prisma.user.update({
            where: { id: userId },
            data: {
              ...(name !== undefined ? { name: name.trim() || null } : {}),
              ...(image !== undefined ? { image: image.trim() || null } : {}),
            },
          }),
        ]
      : []),
    ...(bio !== undefined
      ? [
          prisma.userSettings.upsert({
            where: { userId },
            create: { userId, bio: bio.trim() || null },
            update: { bio: bio.trim() || null },
          }),
        ]
      : []),
  ]);

  return getUserProfile(userId);
}

export async function updatePrivacySettings(
  userId: string,
  data: {
    showActivity?: boolean;
    anonymousMode?: boolean;
    hideSubscriptions?: boolean;
  },
) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function updateNotificationSettings(
  userId: string,
  data: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
    uploadAlerts?: boolean;
    liveAlerts?: boolean;
    promoAlerts?: boolean;
  },
) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function updateLocale(userId: string, locale: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, locale },
    update: { locale },
  });
}
