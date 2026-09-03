import { prisma } from "@/lib/db/prisma";

export async function getFinanceOverview(input?: { from?: Date; to?: Date }) {
  const dateFilter =
    input?.from || input?.to
      ? {
          ...(input.from ? { gte: input.from } : {}),
          ...(input.to ? { lte: input.to } : {}),
        }
      : undefined;

  const [payments, subscriptions, tips, purchases, failedPayments] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        provider: true,
        description: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.subscription.findMany({
      where: dateFilter ? { currentPeriodStart: dateFilter } : undefined,
      orderBy: { currentPeriodStart: "desc" },
      take: 30,
      include: {
        plan: { select: { name: true, priceCents: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.tip.aggregate({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.contentPurchase.aggregate({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.paymentRecord.count({ where: { status: { not: "succeeded" }, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
  ]);

  const revenueCents = payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amountCents, 0);

  return {
    revenueCents,
    paymentCount: payments.length,
    failedPayments,
    tipsCents: tips._sum.amountCents ?? 0,
    tipsCount: tips._count,
    purchasesCents: purchases._sum.amountCents ?? 0,
    purchasesCount: purchases._count,
    recentPayments: payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
    })),
    recentSubscriptions: subscriptions.map((s) => ({
      id: s.id,
      status: s.status,
      plan: s.plan.name,
      priceCents: s.plan.priceCents,
      user: s.user,
      periodEnd: s.currentPeriodEnd?.toISOString() ?? null,
    })),
  };
}

export async function listCommentsForModeration(input: { approved?: boolean; page?: number }) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = 25;
  const where = { approved: input.approved ?? false };

  const [total, items] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { items, total, page, pageSize };
}

export async function moderateCommentAdmin(
  commentId: string,
  action: "approve" | "remove",
  actorId: string,
) {
  if (action === "remove") {
    await prisma.comment.delete({ where: { id: commentId } });
    return { removed: true };
  }
  return prisma.comment.update({ where: { id: commentId }, data: { approved: true } });
}

export async function getComplianceOverview() {
  const [ageVerified, pendingCreators, openReports, recentTerms] = await Promise.all([
    prisma.userSettings.count({ where: { ageVerifiedAt: { not: null } } }),
    prisma.creatorProfile.count({ where: { verificationStatus: "pending" } }),
    prisma.contentReport.count({ where: { category: { in: ["copyright", "dmca", "abuse"] }, status: { in: ["open", "investigating"] } } }),
    prisma.termsAcceptance.findMany({
      orderBy: { acceptedAt: "desc" },
      take: 20,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { ageVerified, pendingCreators, openComplianceReports: openReports, recentTerms };
}

export async function getPlatformSettings() {
  return prisma.platformSetting.findMany({ orderBy: { key: "asc" } });
}

export async function upsertPlatformSetting(key: string, value: unknown, updatedById: string) {
  return prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value), updatedById },
    update: { value: JSON.stringify(value), updatedById },
  });
}

export const DEFAULT_PLATFORM_SETTINGS: Record<string, unknown> = {
  siteName: "manuelaX",
  registrationOpen: true,
  creatorApplicationsOpen: true,
  commentsRequireApproval: true,
  moderationAiEnabled: true,
  maxUploadSizeMb: 500,
  ageVerificationRequired: true,
};
