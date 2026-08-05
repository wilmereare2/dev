import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModeratorUser } from "@/lib/api/require-creator";
import { moderateUpload } from "@/services/creator/uploads";
import { approveCreatorVerification, suspendCreator } from "@/services/creator/profile";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "flag", "remove"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  }

  const upload = await moderateUpload({
    uploadId: id,
    actorId: auth.userId,
    action: parsed.data.action,
    reason: parsed.data.reason,
  });

  if (!upload) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ upload });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      creatorAction: z.enum(["approve_creator", "suspend_creator"]),
      reason: z.string().trim().max(1000).optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const upload = await prisma.creatorUpload.findUnique({ where: { id }, select: { creatorUserId: true } });
  if (!upload) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (parsed.data.creatorAction === "approve_creator") {
    await approveCreatorVerification(upload.creatorUserId);
  } else {
    await suspendCreator(upload.creatorUserId, parsed.data.reason ?? "Policy violation");
  }

  return NextResponse.json({ ok: true });
}
