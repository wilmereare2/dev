import { prisma } from "@/lib/db/prisma";
import {
  computeEffectiveAdStatus,
  formatCtr,
  parseAdPlacement,
  parseAdStatus,
  sanitizeAdText,
  validateDestinationUrl,
  validateImageUrl,
} from "@/lib/ads/validation";

export type AdminAdvertisementRecord = Awaited<ReturnType<typeof listAdvertisementsForAdmin>>[number];

export function mapAdminAdvertisement(record: AdminAdvertisementRecord) {
  const effectiveStatus = computeEffectiveAdStatus({
    status: record.status,
    startAt: record.startAt,
    endAt: record.endAt,
  });

  return {
    id: record.id,
    title: record.title,
    advertiserName: record.advertiserName,
    destinationUrl: record.destinationUrl,
    placement: record.placement,
    status: record.status,
    effectiveStatus,
    priority: record.priority,
    startAt: record.startAt?.toISOString() ?? null,
    endAt: record.endAt?.toISOString() ?? null,
    imageUrl: record.imageUrl,
    imageUrlTablet: record.imageUrlTablet,
    imageUrlMobile: record.imageUrlMobile,
    altText: record.altText,
    impressions: record.impressions,
    clicks: record.clicks,
    ctr: formatCtr(record.impressions, record.clicks),
    archivedAt: record.archivedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy
      ? { id: record.createdBy.id, name: record.createdBy.name, email: record.createdBy.email }
      : null,
  };
}

export async function listAdvertisementsForAdmin(options?: {
  status?: string;
  placement?: string;
  q?: string;
}) {
  const q = options?.q?.trim();
  return prisma.advertisement.findMany({
    where: {
      ...(options?.status && options.status !== "all" ? { status: options.status } : {}),
      ...(options?.placement && options.placement !== "all" ? { placement: options.placement } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { advertiserName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

type AdWriteInput = {
  title: string;
  advertiserName: string;
  destinationUrl: string;
  placement: string;
  status?: string;
  priority?: number;
  startAt?: string | null;
  endAt?: string | null;
  imageUrl?: string | null;
  imageUrlTablet?: string | null;
  imageUrlMobile?: string | null;
  altText?: string | null;
};

function parseOptionalDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function validateAdvertisementInput(input: AdWriteInput) {
  const title = sanitizeAdText(input.title, 200);
  const advertiserName = sanitizeAdText(input.advertiserName, 200);
  const altText = input.altText ? sanitizeAdText(input.altText, 300) : null;

  if (!title) return { ok: false as const, error: "Title is required." };
  if (!advertiserName) return { ok: false as const, error: "Advertiser name is required." };

  const placement = parseAdPlacement(input.placement);
  if (!placement) return { ok: false as const, error: "Select a valid placement." };

  const destination = validateDestinationUrl(input.destinationUrl);
  if (!destination.ok) return destination;

  const imageUrl = validateImageUrl(input.imageUrl);
  if (!imageUrl.ok) return imageUrl;
  const imageUrlTablet = validateImageUrl(input.imageUrlTablet);
  if (!imageUrlTablet.ok) return imageUrlTablet;
  const imageUrlMobile = validateImageUrl(input.imageUrlMobile);
  if (!imageUrlMobile.ok) return imageUrlMobile;

  const status = input.status ? parseAdStatus(input.status) : "draft";
  if (input.status && !status) return { ok: false as const, error: "Invalid status." };

  const priority = Math.min(100, Math.max(0, Number(input.priority ?? 0) || 0));
  const startAt = parseOptionalDate(input.startAt);
  const endAt = parseOptionalDate(input.endAt);

  if (input.startAt && !startAt) return { ok: false as const, error: "Invalid start date." };
  if (input.endAt && !endAt) return { ok: false as const, error: "Invalid end date." };
  if (startAt && endAt && endAt < startAt) {
    return { ok: false as const, error: "End date must be after start date." };
  }

  if (status === "active" && !imageUrl.url) {
    return { ok: false as const, error: "Active ads require a banner image." };
  }

  return {
    ok: true as const,
    data: {
      title,
      advertiserName,
      destinationUrl: destination.url,
      placement,
      status: status ?? "draft",
      priority,
      startAt,
      endAt,
      imageUrl: imageUrl.url,
      imageUrlTablet: imageUrlTablet.url,
      imageUrlMobile: imageUrlMobile.url,
      altText,
    },
  };
}

export async function createAdvertisement(input: AdWriteInput, createdById: string) {
  const validated = validateAdvertisementInput(input);
  if (!validated.ok) return validated;

  const record = await prisma.advertisement.create({
    data: { ...validated.data, createdById },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return { ok: true as const, advertisement: mapAdminAdvertisement(record) };
}

export async function updateAdvertisement(id: string, input: AdWriteInput) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Not found.", status: 404 as const };

  const validated = validateAdvertisementInput(input);
  if (!validated.ok) return validated;

  const archivedAt =
    validated.data.status === "archived" ? existing.archivedAt ?? new Date() : null;

  const record = await prisma.advertisement.update({
    where: { id },
    data: {
      ...validated.data,
      archivedAt,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return { ok: true as const, advertisement: mapAdminAdvertisement(record) };
}

export async function deleteAdvertisement(id: string) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.advertisement.delete({ where: { id } });
  return true;
}

export async function setAdvertisementStatus(id: string, status: string) {
  const parsed = parseAdStatus(status);
  if (!parsed) return { ok: false as const, error: "Invalid status." };

  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Not found.", status: 404 as const };

  if (parsed === "active" && !existing.imageUrl) {
    return { ok: false as const, error: "Upload a banner image before activating." };
  }

  const record = await prisma.advertisement.update({
    where: { id },
    data: {
      status: parsed,
      archivedAt: parsed === "archived" ? existing.archivedAt ?? new Date() : null,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return { ok: true as const, advertisement: mapAdminAdvertisement(record) };
}

export async function getAdvertisementForAdmin(id: string) {
  const record = await prisma.advertisement.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!record) return null;
  return mapAdminAdvertisement(record);
}
