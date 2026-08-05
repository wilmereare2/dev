import { prisma } from "@/lib/db/prisma";
import { deserializeTags } from "@/lib/creator/media";

export async function getCreatorAnalytics(creatorUserId: string) {
  const uploads = await prisma.creatorUpload.findMany({
    where: { creatorUserId },
    select: {
      id: true,
      title: true,
      status: true,
      viewCount: true,
      likeCount: true,
      purchaseCount: true,
      favoriteCount: true,
      ppvPriceCents: true,
      publishedAt: true,
    },
  });

  const contentIds = uploads.map((u) => u.id);
  const sanityIds = uploads.map((u) => u.id).filter(Boolean);

  const [followers, subscriberCount, tips, purchases, platformLikes] = await Promise.all([
    prisma.creatorFollow.count({ where: { creatorId: creatorUserId } }),
    prisma.creatorSubscription.count({ where: { creatorUserId, status: "active" } }),
    prisma.tip.aggregate({ where: { toCreatorUserId: creatorUserId }, _sum: { amountCents: true } }),
    prisma.contentPurchase.aggregate({
      where: { uploadId: { in: contentIds } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.contentLike.count({
      where: {
        contentId: { in: uploads.filter((u) => u.status === "published").map((u) => u.id) },
      },
    }),
  ]);

  const totalViews = uploads.reduce((sum, item) => sum + item.viewCount, 0);
  const totalUploads = uploads.length;
  const publishedUploads = uploads.filter((u) => u.status === "published").length;
  const tipRevenue = tips._sum.amountCents ?? 0;
  const ppvRevenue = purchases._sum.amountCents ?? 0;
  const subscriptionEstimate = subscriberCount * (await getSubscriptionPrice(creatorUserId));

  const bestPerforming = [...uploads]
    .sort((a, b) => b.viewCount + b.purchaseCount * 10 - (a.viewCount + a.purchaseCount * 10))
    .slice(0, 5);

  const last30Days = await prisma.paymentRecord.findMany({
    where: {
      userId: creatorUserId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { amountCents: true, createdAt: true },
  });

  return {
    totals: {
      uploads: totalUploads,
      published: publishedUploads,
      views: totalViews,
      followers,
      subscribers: subscriberCount,
      likes: platformLikes,
    },
    revenue: {
      tipsCents: tipRevenue,
      ppvCents: ppvRevenue,
      subscriptionEstimateCents: subscriptionEstimate,
      totalCents: tipRevenue + ppvRevenue + subscriptionEstimate,
    },
    bestPerforming,
    recentPayments: last30Days,
    sanityIds,
  };
}

async function getSubscriptionPrice(creatorUserId: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: creatorUserId },
    select: { subscriptionPriceCents: true },
  });
  return profile?.subscriptionPriceCents ?? 999;
}

export async function getCreatorOverviewStats(creatorUserId: string) {
  const uploadIds = (
    await prisma.creatorUpload.findMany({
      where: { creatorUserId },
      select: { id: true, sanityContentId: true },
    })
  ).flatMap((u) => [u.id, u.sanityContentId].filter(Boolean)) as string[];

  const [followers, likes, comments, pendingUploads] = await Promise.all([
    prisma.creatorFollow.count({ where: { creatorId: creatorUserId } }),
    uploadIds.length
      ? prisma.contentLike.count({ where: { contentId: { in: uploadIds } } })
      : Promise.resolve(0),
    uploadIds.length
      ? prisma.comment.count({ where: { contentId: { in: uploadIds }, approved: true } })
      : Promise.resolve(0),
    prisma.creatorUpload.count({
      where: { creatorUserId, status: { in: ["draft", "pending_review", "rejected"] } },
    }),
  ]);

  return { followers, likes, comments, pendingUploads };
}

export function formatUploadForClient(
  upload: Awaited<ReturnType<typeof import("@/services/creator/uploads").getCreatorUpload>>,
) {
  if (!upload) return null;
  return {
    ...upload,
    tags: deserializeTags(upload.tags),
    categories: deserializeTags(upload.categories),
    galleryImages: upload.galleryImages ? (JSON.parse(upload.galleryImages) as string[]) : [],
  };
}
