import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/types";

const CREATOR_ROLES: Role[] = ["CREATOR", "ADMIN", "EDITOR", "BUSINESS"];

export async function requireCreatorAccess() {
  const session = await auth();
  if (!session?.user) redirect("/account");

  const role = session.user.role ?? "USER";
  if (CREATOR_ROLES.includes(role as Role)) return session;

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { userId: true },
  });

  if (profile) return session;

  redirect("/create");
}

export async function getCreatorAccessState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      creatorProfile: { select: { verificationStatus: true, displayName: true } },
    },
  });

  if (!user) return { canUpload: false, needsOnboarding: true, role: "USER" as Role };

  const isCreatorRole = CREATOR_ROLES.includes(user.role as Role);
  const hasProfile = Boolean(user.creatorProfile);

  return {
    canUpload: isCreatorRole || hasProfile,
    needsOnboarding: !isCreatorRole && !hasProfile,
    role: user.role as Role,
    verificationStatus: user.creatorProfile?.verificationStatus ?? null,
    displayName: user.creatorProfile?.displayName ?? null,
  };
}
