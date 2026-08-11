import { NextResponse } from "next/server";
import { z } from "zod";
import { createPhoneVerificationCode } from "@/lib/auth/verification-codes";
import { isSmsVerificationConfigured } from "@/lib/auth/verification-delivery";
import { prisma } from "@/lib/db/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendSmsVerificationCode } from "@/services/sms/send-sms";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(20),
});

export async function POST(request: Request) {
  if (!isSmsVerificationConfigured()) {
    return NextResponse.json({ error: "SMS verification is not available." }, { status: 503 });
  }

  const ip = clientIp(request);
  const limit = rateLimit(`send-phone-code:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and phone number." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Verify your email before adding a phone number." }, { status: 400 });
  }

  const codeResult = await createPhoneVerificationCode(parsed.data.phone);
  if (!codeResult.ok) {
    return NextResponse.json({ error: codeResult.error }, { status: 400 });
  }

  const smsResult = await sendSmsVerificationCode(codeResult.phone, codeResult.code);
  if (!smsResult.ok) {
    return NextResponse.json({ error: smsResult.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: "Verification code sent by text message." });
}
