import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailVerificationCode } from "@/lib/auth/verification";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`verify-email-code:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const result = await verifyEmailVerificationCode(parsed.data.email, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Email verified. You can sign in now." });
}
