import { NextResponse } from "next/server";
import { requireModeratorUser } from "@/lib/api/require-creator";
import { approveCreatorVerification, suspendCreator } from "@/services/creator/profile";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const creators = await prisma.creatorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json({ creators });
}

export async function PATCH(request: Request) {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const userId =
    typeof body === "object" && body && "userId" in body ? String((body as { userId?: string }).userId) : "";
  const action = typeof body === "object" && body ? String((body as { action?: string }).action) : "";

  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  if (action === "approve") {
    const profile = await approveCreatorVerification(userId);
    return NextResponse.json({ profile });
  }

  if (action === "suspend") {
    const reason =
      typeof body === "object" && body && "reason" in body ? String((body as { reason?: string }).reason) : "";
    const profile = await suspendCreator(userId, reason || "Policy violation");
    return NextResponse.json({ profile });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
