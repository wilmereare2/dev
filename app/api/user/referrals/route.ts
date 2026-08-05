import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { applyReferralCode, getOrCreateReferralCode, listReferrals } from "@/services/referrals/referrals";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const [code, referrals] = await Promise.all([
    getOrCreateReferralCode(authResult.userId),
    listReferrals(authResult.userId),
  ]);

  return NextResponse.json({ code, referrals });
}

const bodySchema = z.object({ code: z.string().min(4).max(32) });

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid referral code." }, { status: 400 });
  }

  const result = await applyReferralCode(authResult.userId, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
