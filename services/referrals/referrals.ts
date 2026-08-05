import { prisma } from "@/lib/db/prisma";

function generateCode(userId: string) {
  return `MX-${userId.slice(-6).toUpperCase()}`;
}

export async function getOrCreateReferralCode(userId: string) {
  const existing = await prisma.referral.findFirst({
    where: { referrerId: userId, referredUserId: null },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.referral.create({
    data: {
      referrerId: userId,
      code: generateCode(userId),
    },
  });
}

export async function applyReferralCode(referredUserId: string, code: string) {
  const referral = await prisma.referral.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!referral || referral.referrerId === referredUserId) {
    return { ok: false as const, error: "Invalid referral code." };
  }

  await prisma.referral.update({
    where: { id: referral.id },
    data: { referredUserId },
  });

  return { ok: true as const };
}

export async function listReferrals(userId: string) {
  return prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
  });
}
