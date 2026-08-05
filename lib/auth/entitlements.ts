import { prisma } from "@/lib/db/prisma";

export async function userHasActiveSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
  });
  return Boolean(subscription);
}

export async function requirePremiumAccess(userId: string) {
  return userHasActiveSubscription(userId);
}
