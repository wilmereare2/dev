import { NextResponse } from "next/server";
import { requireCreatorUser } from "@/lib/api/require-creator";
import { getCreatorOverviewStats } from "@/services/creator/analytics";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const stats = await getCreatorOverviewStats(auth.userId);

  const earnings = await prisma.$transaction([
    prisma.tip.aggregate({ where: { toCreatorUserId: auth.userId }, _sum: { amountCents: true } }),
    prisma.contentPurchase.aggregate({
      where: { upload: { creatorUserId: auth.userId } },
      _sum: { amountCents: true },
    }),
    prisma.creatorSubscription.count({ where: { creatorUserId: auth.userId, status: "active" } }),
  ]);

  return NextResponse.json({
    stats: {
      ...stats,
      tipRevenueCents: earnings[0]._sum.amountCents ?? 0,
      ppvRevenueCents: earnings[1]._sum.amountCents ?? 0,
      activeSubscribers: earnings[2],
    },
  });
}
