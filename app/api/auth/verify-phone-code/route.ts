import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPhoneVerificationCode } from "@/lib/auth/verification-codes";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  code: z.string().min(6).max(6),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`verify-phone-code:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number and 6-digit code." }, { status: 400 });
  }

  const result = await verifyPhoneVerificationCode(
    parsed.data.email,
    parsed.data.phone,
    parsed.data.code,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Phone number verified." });
}
