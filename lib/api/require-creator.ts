import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { userCanUpload } from "@/services/creator/onboard";
import { prisma } from "@/lib/db/prisma";

export async function requireCreatorUser() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult;

  const canUpload = await userCanUpload(authResult.userId);
  if (!canUpload) {
    return {
      error: NextResponse.json(
        {
          error: "Creator tools are not enabled yet. Go to /create to enable uploads.",
          code: "CREATOR_REQUIRED",
          href: "/create",
        },
        { status: 403 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { role: true },
  });

  return { ...authResult, role: user?.role ?? "USER" };
}

export async function requireModeratorUser() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult;

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { role: true },
  });

  if (!user || !["ADMIN", "MODERATOR", "EDITOR"].includes(user.role)) {
    return { error: NextResponse.json({ error: "Moderator access required." }, { status: 403 }) };
  }

  return authResult;
}
