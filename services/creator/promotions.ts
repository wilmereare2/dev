import { prisma } from "@/lib/db/prisma";

export async function listPromotions(creatorUserId: string) {
  return prisma.promotionalPost.findMany({
    where: { creatorUserId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listBusinessPromotions(businessId: string) {
  return prisma.promotionalPost.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPromotion(input: {
  creatorUserId?: string;
  businessId?: string;
  title: string;
  body?: string;
  bannerUrl?: string;
  teaserVideoUrl?: string;
  couponCode?: string;
  discountPercent?: number;
  externalUrl?: string;
  featuredContentId?: string;
  expiresAt?: Date | null;
}) {
  return prisma.promotionalPost.create({
    data: {
      creatorUserId: input.creatorUserId ?? null,
      businessId: input.businessId ?? null,
      title: input.title.trim(),
      body: input.body?.trim() || null,
      bannerUrl: input.bannerUrl ?? null,
      teaserVideoUrl: input.teaserVideoUrl ?? null,
      couponCode: input.couponCode ?? null,
      discountPercent: input.discountPercent ?? null,
      externalUrl: input.externalUrl ?? null,
      featuredContentId: input.featuredContentId ?? null,
      expiresAt: input.expiresAt ?? null,
      status: "published",
    },
  });
}

export async function updatePromotion(
  id: string,
  owner: { creatorUserId?: string; businessId?: string },
  data: Partial<Omit<Parameters<typeof createPromotion>[0], "creatorUserId" | "businessId">>,
) {
  const existing = await prisma.promotionalPost.findFirst({
    where: {
      id,
      ...(owner.creatorUserId ? { creatorUserId: owner.creatorUserId } : {}),
      ...(owner.businessId ? { businessId: owner.businessId } : {}),
    },
  });
  if (!existing) return null;

  return prisma.promotionalPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.body !== undefined ? { body: data.body?.trim() || null } : {}),
      ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl } : {}),
      ...(data.teaserVideoUrl !== undefined ? { teaserVideoUrl: data.teaserVideoUrl } : {}),
      ...(data.couponCode !== undefined ? { couponCode: data.couponCode } : {}),
      ...(data.discountPercent !== undefined ? { discountPercent: data.discountPercent } : {}),
      ...(data.externalUrl !== undefined ? { externalUrl: data.externalUrl } : {}),
      ...(data.featuredContentId !== undefined ? { featuredContentId: data.featuredContentId } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
    },
  });
}

export async function deletePromotion(id: string, owner: { creatorUserId?: string; businessId?: string }) {
  const existing = await prisma.promotionalPost.findFirst({
    where: {
      id,
      ...(owner.creatorUserId ? { creatorUserId: owner.creatorUserId } : {}),
      ...(owner.businessId ? { businessId: owner.businessId } : {}),
    },
  });
  if (!existing) return false;
  await prisma.promotionalPost.delete({ where: { id } });
  return true;
}

export async function listActivePromotions(limit = 20) {
  return prisma.promotionalPost.findMany({
    where: {
      status: "published",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      creator: { select: { id: true, name: true, image: true } },
      business: { select: { id: true, name: true, slug: true, bannerUrl: true } },
    },
  });
}
