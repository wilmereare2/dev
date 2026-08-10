import { generateSecret, generateURI, verify } from "otplib";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function getTwoFactorStatus(userId: string) {
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  return { enabled: record?.enabled ?? false, configured: Boolean(record) };
}

export async function setupTwoFactor(userId: string, email: string) {
  const secret = generateSecret();
  const otpauth = generateURI({ issuer: "manuelaX", label: email, secret });

  await prisma.twoFactorAuth.upsert({
    where: { userId },
    create: { userId, secret, enabled: false },
    update: { secret, enabled: false },
  });

  return { secret, otpauth };
}

export async function enableTwoFactor(userId: string, token: string) {
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  if (!record) return { ok: false as const, error: "Set up 2FA first." };

  const result = await verify({ token, secret: record.secret });
  if (!result.valid) return { ok: false as const, error: "Invalid verification code." };

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { enabled: true },
  });

  return { ok: true as const };
}

export async function disableTwoFactor(userId: string, token: string) {
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  if (!record?.enabled) return { ok: false as const, error: "2FA is not enabled." };

  const result = await verify({ token, secret: record.secret });
  if (!result.valid) return { ok: false as const, error: "Invalid verification code." };

  await prisma.twoFactorAuth.delete({ where: { userId } });
  return { ok: true as const };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    return { ok: false as const, error: "You cannot block yourself." };
  }

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });

  return { ok: true as const };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
  return { ok: true as const };
}

export async function listBlockedUsers(blockerId: string) {
  return prisma.blockedUser.findMany({
    where: { blockerId },
    include: {
      blocked: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function muteUser(muterId: string, mutedId: string) {
  if (muterId === mutedId) {
    return { ok: false as const, error: "You cannot mute yourself." };
  }

  await prisma.mutedUser.upsert({
    where: { muterId_mutedId: { muterId, mutedId } },
    create: { muterId, mutedId },
    update: {},
  });

  return { ok: true as const };
}

export async function unmuteUser(muterId: string, mutedId: string) {
  await prisma.mutedUser.deleteMany({ where: { muterId, mutedId } });
  return { ok: true as const };
}

export async function listMutedUsers(muterId: string) {
  return prisma.mutedUser.findMany({
    where: { muterId },
    include: {
      muted: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function exportUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      bookmarks: true,
      watchLater: true,
      watchHistory: true,
      creatorFollows: true,
      contentLikes: true,
      subscriptions: { include: { plan: true } },
      payments: true,
      notifications: true,
      termsAccepted: true,
    },
  });

  return {
    exportedAt: new Date().toISOString(),
    user,
  };
}

export async function deleteUserAccount(userId: string, password?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false as const, error: "Account not found." };

  if (user.passwordHash) {
    if (!password) return { ok: false as const, error: "Password required to delete account." };
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { ok: false as const, error: "Incorrect password." };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { ok: true as const };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    return { ok: false as const, error: "Password sign-in is not enabled for this account." };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { ok: false as const, error: "Current password is incorrect." };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { ok: true as const };
}
