import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorStatus,
  setupTwoFactor,
} from "@/services/user/security";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const status = await getTwoFactorStatus(authResult.userId);
  return NextResponse.json(status);
}

export async function POST() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const user = await prisma.user.findUnique({ where: { id: authResult.userId } });
  if (!user?.email) {
    return NextResponse.json({ error: "Email required for 2FA setup." }, { status: 400 });
  }

  const setup = await setupTwoFactor(authResult.userId, user.email);
  return NextResponse.json(setup);
}

const tokenSchema = z.object({ token: z.string().min(6).max(8), action: z.enum(["enable", "disable"]) });

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = tokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid 2FA request." }, { status: 400 });
  }

  const result =
    parsed.data.action === "enable"
      ? await enableTwoFactor(authResult.userId, parsed.data.token)
      : await disableTwoFactor(authResult.userId, parsed.data.token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
