import { prisma } from "@/lib/db/prisma";

const ownerSelect = {
  creator: { select: { id: true, name: true, email: true, image: true, role: true } },
  business: { select: { id: true, name: true, slug: true, bannerUrl: true } },
} as const;

export type AdminPromotionRecord = Awaited<ReturnType<typeof listPromotionsForAdmin>>[number];

export function mapAdminPromotion(record: AdminPromotionRecord) {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    bannerUrl: record.bannerUrl,
    teaserVideoUrl: record.teaserVideoUrl,
    couponCode: record.couponCode,
    discountPercent: record.discountPercent,
    externalUrl: record.externalUrl,
    featuredContentId: record.featuredContentId,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    creator: record.creator,
    business: record.business,
  };
}

export async function listPromotionsForAdmin(options?: { status?: string; limit?: number }) {
  const take = Math.min(Math.max(options?.limit ?? 100, 1), 200);
  return prisma.promotionalPost.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    include: ownerSelect,
  });
}

export async function listPromotionsUpdatedSince(since: Date) {
  return prisma.promotionalPost.findMany({
    where: { updatedAt: { gt: since } },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: 50,
    include: ownerSelect,
  });
}

export async function countPromotionsByStatus() {
  const [total, published, draft, removed, flagged] = await Promise.all([
    prisma.promotionalPost.count(),
    prisma.promotionalPost.count({ where: { status: "published" } }),
    prisma.promotionalPost.count({ where: { status: "draft" } }),
    prisma.promotionalPost.count({ where: { status: "removed" } }),
    prisma.promotionalPost.count({ where: { status: "flagged" } }),
  ]);

  return { total, published, draft, removed, flagged };
}

export async function moderatePromotion(input: {
  promotionId: string;
  action: "publish" | "remove" | "flag" | "restore";
}) {
  const existing = await prisma.promotionalPost.findUnique({
    where: { id: input.promotionId },
    select: {
      id: true,
      title: true,
      status: true,
      creatorUserId: true,
      businessId: true,
    },
  });
  if (!existing) return null;

  const status =
    input.action === "publish"
      ? "published"
      : input.action === "remove"
        ? "removed"
        : input.action === "flag"
          ? "flagged"
          : "published";

  const wasPublished = existing.status === "published";
  const isNowPublished = status === "published";

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.promotionalPost.update({
      where: { id: input.promotionId },
      data: { status },
      include: ownerSelect,
    });

    if (isNowPublished && !wasPublished) {
      const recipientIds = new Set<string>();
      if (existing.creatorUserId) recipientIds.add(existing.creatorUserId);

      if (existing.businessId) {
        const business = await tx.businessAccount.findUnique({
          where: { id: existing.businessId },
          select: { ownerUserId: true },
        });
        if (business?.ownerUserId) recipientIds.add(business.ownerUserId);
      }

      const href = existing.creatorUserId
        ? "/creator-dashboard/promotions"
        : "/business-dashboard/campaigns";

      for (const userId of recipientIds) {
        await tx.notification.create({
          data: {
            userId,
            type: "promotion_approved",
            title: "Promotion approved",
            body: `"${existing.title}" has been approved and is now live.`,
            href,
          },
        });
      }
    }

    return record;
  });

  return mapAdminPromotion(updated);
}

export async function deletePromotionAsAdmin(promotionId: string) {
  const existing = await prisma.promotionalPost.findUnique({ where: { id: promotionId } });
  if (!existing) return false;
  await prisma.promotionalPost.delete({ where: { id: promotionId } });
  return true;
}
