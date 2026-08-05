import { prisma } from "@/lib/db/prisma";

export async function listActivePlans() {
  return prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

export async function listUserPayments(userId: string) {
  return prisma.paymentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function activateSubscription(input: {
  userId: string;
  planSlug: string;
  providerSubscriptionId?: string;
  periodDays?: number;
}) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: input.planSlug } });
  if (!plan) return null;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + (input.periodDays ?? (plan.interval === "year" ? 365 : 30)));

  const existing = await prisma.subscription.findFirst({
    where: { userId: input.userId, planId: plan.id },
  });

  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        providerSubscriptionId: input.providerSubscriptionId ?? existing.providerSubscriptionId,
      },
      include: { plan: true },
    });
  }

  return prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
    },
    include: { plan: true },
  });
}

export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { in: ["active", "trialing"] } },
  });
  if (!subscription) return null;

  return prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
    include: { plan: true },
  });
}

export async function recordPayment(input: {
  userId: string;
  amountCents: number;
  currency?: string;
  status: string;
  providerRef?: string;
  description?: string;
}) {
  return prisma.paymentRecord.create({
    data: {
      userId: input.userId,
      amountCents: input.amountCents,
      currency: input.currency ?? "usd",
      status: input.status,
      providerRef: input.providerRef ?? null,
      description: input.description ?? null,
    },
  });
}
