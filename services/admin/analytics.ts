import { prisma } from "@/lib/db/prisma";

export type DateRangePreset = "7d" | "30d" | "90d" | "month" | "all";

function rangeFromPreset(preset: DateRangePreset) {
  const now = new Date();
  if (preset === "all") return { from: null as Date | null, to: now };
  const from = new Date(now);
  if (preset === "7d") from.setDate(from.getDate() - 7);
  else if (preset === "30d") from.setDate(from.getDate() - 30);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else if (preset === "month") from.setDate(1);
  from.setHours(0, 0, 0, 0);
  return { from, to: now };
}

function dateBuckets(from: Date, to: Date) {
  const buckets: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    buckets.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export async function getAdminDashboardAnalytics(preset: DateRangePreset = "30d") {
  const { from, to } = rangeFromPreset(preset);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const dateFilter = from ? { gte: from, lte: to } : undefined;

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    newUsersInRange,
    activeSubscriptions,
    totalCreators,
    pendingCreators,
    suspendedCreators,
    pendingUploads,
    flaggedUploads,
    publishedUploads,
    openReports,
    pendingReports,
    openTickets,
    revenueAgg,
    adStats,
    storageBytes,
    recentAudit,
    recentReports,
    usersByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    from ? prisma.user.count({ where: { createdAt: dateFilter } }) : prisma.user.count(),
    prisma.subscription.count({ where: { status: { in: ["active", "trialing"] } } }),
    prisma.creatorProfile.count(),
    prisma.creatorProfile.count({ where: { verificationStatus: "pending" } }),
    prisma.creatorProfile.count({ where: { suspendedAt: { not: null } } }),
    prisma.creatorUpload.count({ where: { status: "pending_review" } }),
    prisma.creatorUpload.count({ where: { status: "flagged" } }),
    prisma.creatorUpload.count({ where: { status: { in: ["approved", "published"] } } }),
    prisma.contentReport.count({ where: { status: "open" } }),
    prisma.contentReport.count({ where: { status: { in: ["open", "investigating"] } } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.paymentRecord.aggregate({
      where: {
        status: "succeeded",
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.advertisement.aggregate({ _sum: { impressions: true, clicks: true }, _count: true }),
    prisma.creatorUpload.aggregate({ _sum: { fileSizeBytes: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.contentReport.findMany({
      where: { status: { in: ["open", "investigating"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { reporter: { select: { name: true, email: true } } },
    }),
    from
      ? prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
          SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
          FROM "User"
          WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          GROUP BY 1 ORDER BY 1`
      : Promise.resolve([]),
  ]);

  const bucketLabels = from ? dateBuckets(from, to) : [];
  const signupTrend = bucketLabels.map((label) => {
    const match = usersByDay.find((row) => row.day.toISOString().slice(0, 10) === label);
    return { date: label, count: match ? Number(match.count) : 0 };
  });

  const impressions = adStats._sum.impressions ?? 0;
  const clicks = adStats._sum.clicks ?? 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const warnings: string[] = [];
  if (pendingUploads > 0) warnings.push(`${pendingUploads} uploads awaiting moderation`);
  if (openReports > 10) warnings.push(`${openReports} open reports need attention`);
  if (pendingCreators > 0) warnings.push(`${pendingCreators} creator applications pending`);

  return {
    preset,
    range: { from: from?.toISOString() ?? null, to: to.toISOString() },
    totals: {
      users: totalUsers,
      creators: totalCreators,
      publishedContent: publishedUploads,
      activeSubscriptions,
      openReports,
      pendingReports,
      openTickets,
      revenueCents: revenueAgg._sum.amountCents ?? 0,
      paymentCount: revenueAgg._count,
      adImpressions: impressions,
      adClicks: clicks,
      adCtr: ctr,
      storageBytes: storageBytes._sum.fileSizeBytes ?? 0,
    },
    growth: {
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      newUsersInRange,
    },
    queues: {
      pendingCreators,
      suspendedCreators,
      pendingUploads,
      flaggedUploads,
    },
    signupTrend,
    recentAudit: recentAudit.map((row) => ({
      id: row.id,
      action: row.action,
      targetLabel: row.targetLabel,
      entity: row.entity,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor ? { name: row.actor.name, email: row.actor.email } : null,
    })),
    recentReports: recentReports.map((row) => ({
      id: row.id,
      reason: row.reason,
      category: row.category,
      priority: row.priority,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      reporter: row.reporter.name ?? row.reporter.email,
    })),
    warnings,
  };
}
