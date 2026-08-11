import { prisma } from "@/lib/db/prisma";
import { PUBLIC_USER_SELECT } from "@/lib/user/public-select";

const memberUserSelect = PUBLIC_USER_SELECT;

export async function getOrCreateBusinessAccount(ownerUserId: string, name: string) {
  const existing = await prisma.businessAccount.findFirst({ where: { ownerUserId } });
  if (existing) return existing;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return prisma.businessAccount.create({
    data: {
      name,
      slug: `${slug}-${ownerUserId.slice(-4)}`,
      ownerUserId,
      verifiedAt: new Date(),
      members: { create: { userId: ownerUserId, role: "owner" } },
    },
  });
}

export async function getBusinessAccountForUser(userId: string) {
  const owned = await prisma.businessAccount.findFirst({
    where: { ownerUserId: userId },
    include: { members: { include: { user: { select: memberUserSelect } } } },
  });
  if (owned) return owned;

  const membership = await prisma.businessMember.findFirst({
    where: { userId },
    include: {
      business: {
        include: { members: { include: { user: { select: memberUserSelect } } } },
      },
    },
  });
  return membership?.business ?? null;
}

export async function updateBusinessAccount(
  businessId: string,
  ownerUserId: string,
  data: { name?: string; description?: string; bannerUrl?: string; affiliateUrl?: string },
) {
  const business = await prisma.businessAccount.findFirst({ where: { id: businessId, ownerUserId } });
  if (!business) return null;
  return prisma.businessAccount.update({ where: { id: businessId }, data });
}
