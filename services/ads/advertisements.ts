import { prisma } from "@/lib/db/prisma";
import { isAdEligibleForServe } from "@/lib/ads/validation";
import type { AdPlacement } from "@/lib/ads/placements";

export type PublicAdPayload = {
  id: string;
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  /** "direct" renders our banner; "script"/"iframe" render a sandboxed frame. */
  creativeType: string;
  networkName: string | null;
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
  creativeType?: string | null;
  networkName?: string | null;
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
    creativeType: record.creativeType ?? "direct",
    networkName: record.networkName ?? null,
    imageUrl: record.imageUrl,
    imageUrlTablet: record.imageUrlTablet,
    imageUrlMobile: record.imageUrlMobile,
    altText: record.altText,
  };
}

type AdRow = {
  id: string;
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  creativeType: string;
  networkName: string | null;
  imageUrl: string | null;
  imageUrlTablet: string | null;
  imageUrlMobile: string | null;
  altText: string | null;
};

/**
 * Fair rotation: highest priority tier first, then least recently served.
 *
 * Resolves every requested placement in ONE statement, picking a winner per
 * placement with DISTINCT ON and stamping `lastServedAt` as it goes. A page
 * with a banner plus a four-slot rail therefore costs one database round trip
 * instead of one per slot, and no slot can serve an ad without marking it.
 */
export async function selectAdvertisementsForPlacements(placements: AdPlacement[]) {
  const unique = [...new Set(placements)];
  if (!unique.length) return {} as Record<string, PublicAdPayload | null>;

  const rows = await prisma.$queryRaw<AdRow[]>`
    UPDATE "Advertisement" AS a
       SET "lastServedAt" = NOW()
     WHERE a.id IN (
             SELECT DISTINCT ON (c.placement) c.id
               FROM "Advertisement" AS c
              WHERE c.placement = ANY(${unique}::text[])
                AND c.status = 'active'
                AND c."archivedAt" IS NULL
                AND (c."startAt" IS NULL OR c."startAt" <= NOW())
                AND (c."endAt" IS NULL OR c."endAt" >= NOW())
              ORDER BY c.placement,
                       c.priority DESC,
                       c."lastServedAt" ASC NULLS FIRST,
                       c."createdAt" ASC
           )
 RETURNING a.id,
           a.title,
           a."advertiserName",
           a."destinationUrl",
           a.placement,
           a."creativeType",
           a."networkName",
           a."imageUrl",
           a."imageUrlTablet",
           a."imageUrlMobile",
           a."altText"
  `;

  const byPlacement: Record<string, PublicAdPayload | null> = {};
  for (const placement of unique) byPlacement[placement] = null;
  for (const row of rows) byPlacement[row.placement] = mapPublicAd(row);

  return byPlacement;
}

/** Single-placement convenience wrapper over the batched query. */
export async function selectAdvertisementForPlacement(placement: AdPlacement) {
  const result = await selectAdvertisementsForPlacements([placement]);
  return result[placement] ?? null;
}

export async function recordAdImpression(adId: string, dedupeKey: string) {
  const result = await recordAdImpressions([{ adId, dedupeKey }]);
  return { counted: result.counted > 0 };
}

/**
 * Records several impressions in one statement.
 *
 * A page with a rail can bring five slots into view at once; as separate
 * requests that meant five round trips and five transactions per view.
 *
 * `ON CONFLICT DO NOTHING ... RETURNING` reports exactly which dedupe keys were
 * newly inserted, so each counter is incremented by the number of genuinely new
 * impressions for that ad — a repeated view still counts once.
 */
export async function recordAdImpressions(entries: { adId: string; dedupeKey: string }[]) {
  const unique = new Map<string, { adId: string; dedupeKey: string }>();
  for (const entry of entries) {
    if (!entry.adId || !entry.dedupeKey) continue;
    unique.set(`${entry.adId}:${entry.dedupeKey}`, entry);
  }
  const rows = [...unique.values()];
  if (!rows.length) return { counted: 0 };

  const adIds = rows.map((row) => row.adId);
  const dedupeKeys = rows.map((row) => row.dedupeKey);

  try {
    const updated = await prisma.$queryRaw<{ id: string; added: number }[]>`
      WITH inserted AS (
        INSERT INTO "AdImpressionKey" ("id", "adId", "dedupeKey")
        SELECT gen_random_uuid()::text, input.ad_id, input.dedupe_key
          FROM UNNEST(${adIds}::text[], ${dedupeKeys}::text[]) AS input(ad_id, dedupe_key)
        ON CONFLICT ("adId", "dedupeKey") DO NOTHING
        RETURNING "adId"
      ),
      totals AS (
        SELECT "adId", COUNT(*)::int AS added FROM inserted GROUP BY "adId"
      )
      UPDATE "Advertisement" AS a
         SET impressions = a.impressions + totals.added
        FROM totals
       WHERE a.id = totals."adId"
   RETURNING a.id, totals.added
    `;

    return { counted: updated.reduce((sum, row) => sum + Number(row.added), 0) };
  } catch {
    return { counted: 0 };
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
