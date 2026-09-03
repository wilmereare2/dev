import { prisma } from "@/lib/db/prisma";
import { isAdEligibleForServe } from "@/lib/ads/validation";
import type { AdPlacement } from "@/lib/ads/placements";

export type PublicAdPayload = {
  id: string;
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  imageUrl: string | null;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
  altText: string | null;
};

function mapPublicAd(record: {
  id: string;
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  imageUrl: string | null;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
  altText: string | null;
}): PublicAdPayload {
  return {
    id: record.id,
    title: record.title,
    advertiserName: record.advertiserName,
    destinationUrl: record.destinationUrl,
    placement: record.placement,
    imageUrl: record.imageUrl,
    imageUrlTablet: record.imageUrlTablet,
    imageUrlMobile: record.imageUrlMobile,
    altText: record.altText,
  };
}

/** Fair rotation: highest priority tier first, then least recently served. */
export async function selectAdvertisementForPlacement(placement: AdPlacement) {
  const now = new Date();
  const candidates = await prisma.advertisement.findMany({
    where: {
      placement,
      status: "active",
      archivedAt: null,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { lastServedAt: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  const eligible = candidates.filter((ad) =>
    isAdEligibleForServe({
      status: ad.status,
      startAt: ad.startAt,
      endAt: ad.endAt,
      archivedAt: ad.archivedAt,
      now,
    }),
  );

  if (!eligible.length) return null;

  const topPriority = eligible[0].priority;
  const tier = eligible.filter((ad) => ad.priority === topPriority);
  const pick = tier[0];

  await prisma.advertisement.update({
    where: { id: pick.id },
    data: { lastServedAt: now },
  });

  return mapPublicAd(pick);
}

export async function recordAdImpression(adId: string, dedupeKey: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.adImpressionKey.createMany({
        data: [{ adId, dedupeKey }],
        skipDuplicates: true,
      });
      if (created.count === 0) return;
      await tx.advertisement.update({
        where: { id: adId },
        data: { impressions: { increment: 1 } },
      });
    });
    return { counted: true };
  } catch {
    return { counted: false };
  }
}

export async function recordAdClick(adId: string) {
  const ad = await prisma.advertisement.findUnique({
    where: { id: adId },
    select: { id: true, destinationUrl: true, status: true, archivedAt: true, startAt: true, endAt: true },
  });
  if (!ad) return null;
  if (
    !isAdEligibleForServe({
      status: ad.status,
      startAt: ad.startAt,
      endAt: ad.endAt,
      archivedAt: ad.archivedAt,
    })
  ) {
    return null;
  }

  await prisma.advertisement.update({
    where: { id: adId },
    data: { clicks: { increment: 1 } },
  });

  return ad.destinationUrl;
}

export async function getAdvertisementById(adId: string) {
  const ad = await prisma.advertisement.findUnique({ where: { id: adId } });
  if (!ad) return null;
  return mapPublicAd(ad);
}
