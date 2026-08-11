import { prisma } from "@/lib/db/prisma";

export async function getUserSettings(userId: string) {
  try {
    return await prisma.userSettings.findUnique({ where: { userId } });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[settings] getUserSettings failed:", error);
    }
    return null;
  }
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

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    bio?: string;
    image?: string;
    avatarScale?: number;
    avatarFocusX?: number;
    avatarFocusY?: number;
  },
) {
  const { name, bio, image, avatarScale, avatarFocusX, avatarFocusY } = data;
  const settingsPatch =
    bio !== undefined ||
    avatarScale !== undefined ||
    avatarFocusX !== undefined ||
    avatarFocusY !== undefined;

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
    ...(settingsPatch
      ? [
          prisma.userSettings.upsert({
            where: { userId },
            create: {
              userId,
              ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
              ...(avatarScale !== undefined ? { avatarScale } : {}),
              ...(avatarFocusX !== undefined ? { avatarFocusX } : {}),
              ...(avatarFocusY !== undefined ? { avatarFocusY } : {}),
            },
            update: {
              ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
              ...(avatarScale !== undefined ? { avatarScale } : {}),
              ...(avatarFocusX !== undefined ? { avatarFocusX } : {}),
              ...(avatarFocusY !== undefined ? { avatarFocusY } : {}),
            },
          }),
        ]
      : []),
  ]);

  return getUserProfile(userId);
}

export async function getAvatarFraming(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { avatarScale: true, avatarFocusX: true, avatarFocusY: true },
  });
  return {
    scale: settings?.avatarScale ?? 100,
    focusX: settings?.avatarFocusX ?? 0,
    focusY: settings?.avatarFocusY ?? 0,
  };
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
