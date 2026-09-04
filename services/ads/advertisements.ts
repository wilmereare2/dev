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

/**
 * Fair rotation: highest priority tier first, then least recently served.
 *
 * Picks the winner and stamps `lastServedAt` in a single statement. Doing this
 * as a select-then-update cost two database round trips on every ad request —
 * the dominant cost of serving a page — and let two concurrent requests pick
 * the same ad before either had marked it as served.
 */
export async function selectAdvertisementForPlacement(placement: AdPlacement) {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      title: string;
      advertiserName: string;
      destinationUrl: string;
      placement: string;
      imageUrl: string | null;
      imageUrlTablet: string | null;
      imageUrlMobile: string | null;
      altText: string | null;
    }[]
  >`
    UPDATE "Advertisement" AS a
       SET "lastServedAt" = NOW()
     WHERE a.id = (
             SELECT c.id
               FROM "Advertisement" AS c
              WHERE c.placement = ${placement}
                AND c.status = 'active'
                AND c."archivedAt" IS NULL
                AND (c."startAt" IS NULL OR c."startAt" <= NOW())
                AND (c."endAt" IS NULL OR c."endAt" >= NOW())
              ORDER BY c.priority DESC,
                       c."lastServedAt" ASC NULLS FIRST,
                       c."createdAt" ASC
              LIMIT 1
             FOR UPDATE SKIP LOCKED
           )
 RETURNING a.id,
           a.title,
           a."advertiserName",
           a."destinationUrl",
           a.placement,
           a."imageUrl",
           a."imageUrlTablet",
           a."imageUrlMobile",
           a."altText"
  `;

  const pick = rows[0];
  if (!pick) return null;

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
