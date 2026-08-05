import { prisma } from "@/lib/db/prisma";
import { ensureSanityCreatorDoc } from "@/services/creator/profile";

export async function onboardAsCreator(userId: string, displayName?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  if (["ADMIN", "EDITOR", "MODERATOR"].includes(user.role)) {
    return { ok: true as const, alreadyCreator: true, role: user.role };
  }

  const autoApprove = process.env.NODE_ENV === "development" || process.env.CREATOR_AUTO_APPROVE === "true";

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "BUSINESS" ? "BUSINESS" : "CREATOR" },
  });

  const profile = await prisma.creatorProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: displayName?.trim() || user.name || user.email.split("@")[0],
      verificationStatus: autoApprove ? "approved" : "pending",
      verifiedAt: autoApprove ? new Date() : null,
    },
    update: {
      displayName: displayName?.trim() || undefined,
      ...(autoApprove
        ? { verificationStatus: "approved", verifiedAt: new Date() }
        : { verificationStatus: "pending" }),
    },
  });

  await ensureSanityCreatorDoc(userId).catch(() => null);

  await prisma.notification.create({
    data: {
      userId,
      type: "creator_onboarded",
      title: autoApprove ? "Creator tools enabled" : "Creator application received",
      body: autoApprove
        ? "You can upload content from Create → Upload or your creator dashboard."
        : "You can upload drafts now. Full publishing unlocks after verification.",
      href: "/create/upload",
    },
  });

  return {
    ok: true as const,
    profile,
    role: user.role === "BUSINESS" ? "BUSINESS" : "CREATOR",
    autoApproved: autoApprove,
  };
}

export async function userCanUpload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, creatorProfile: { select: { userId: true } } },
  });

  if (!user) return false;
  if (["CREATOR", "ADMIN", "EDITOR", "BUSINESS"].includes(user.role)) return true;
  return Boolean(user.creatorProfile);
}
