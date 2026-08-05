import { prisma } from "@/lib/db/prisma";
import { getSanityWriteClient } from "@/lib/sanity/write-client";

export async function getOrCreateCreatorProfile(userId: string) {
  const existing = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true },
  });
  if (!user || !["CREATOR", "ADMIN", "EDITOR", "BUSINESS"].includes(user.role)) {
    return null;
  }

  return prisma.creatorProfile.create({
    data: {
      userId,
      displayName: user.name ?? user.email.split("@")[0],
      verificationStatus: user.role === "ADMIN" || user.role === "EDITOR" ? "approved" : "pending",
      verifiedAt: user.role === "ADMIN" || user.role === "EDITOR" ? new Date() : null,
    },
  });
}

export async function linkSanityCreator(userId: string, sanityCreatorId: string, slug: string) {
  return prisma.creatorProfile.update({
    where: { userId },
    data: { sanityCreatorId, sanityCreatorSlug: slug },
  });
}

export async function approveCreatorVerification(userId: string) {
  const profile = await prisma.creatorProfile.update({
    where: { userId },
    data: { verificationStatus: "approved", verifiedAt: new Date(), suspendedAt: null, suspensionReason: null },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: "CREATOR" },
  });

  return profile;
}

export async function suspendCreator(userId: string, reason: string) {
  return prisma.creatorProfile.update({
    where: { userId },
    data: { verificationStatus: "suspended", suspendedAt: new Date(), suspensionReason: reason },
  });
}

export async function ensureSanityCreatorDoc(userId: string) {
  const profile = await getOrCreateCreatorProfile(userId);
  if (!profile || profile.sanityCreatorId) return profile;

  const client = getSanityWriteClient();
  if (!client) return profile;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  const name = profile.displayName ?? user?.name ?? user?.email?.split("@")[0] ?? "Creator";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const doc = await client.create({
    _type: "creator",
    name,
    slug: { _type: "slug", current: slug },
    bio: profile.bio ?? "",
  });

  return linkSanityCreator(userId, doc._id, slug);
}
