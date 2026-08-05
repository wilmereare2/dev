import { prisma } from "@/lib/db/prisma";
import { bootstrapAdminResources } from "@/lib/admin/bootstrap";
import { isDesignatedAdminEmail } from "@/lib/auth/admin-email";
import { ensureSanityCreatorDoc } from "@/services/creator/profile";

export async function provisionAdministrator(userId: string) {
  await bootstrapAdminResources();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return;

  await prisma.creatorProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: user.name || user.email.split("@")[0],
      verificationStatus: "approved",
      verifiedAt: new Date(),
    },
    update: {
      verificationStatus: "approved",
      verifiedAt: new Date(),
    },
  });

  await ensureSanityCreatorDoc(userId).catch(() => null);
}

export async function ensureDesignatedAdminAccess(userId: string, email: string | null | undefined) {
  if (!isDesignatedAdminEmail(email)) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;

  if (user.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });
  }

  await provisionAdministrator(userId);
  return true;
}
