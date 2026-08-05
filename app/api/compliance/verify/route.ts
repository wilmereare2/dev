import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  ageVerifiedCookieOptions,
  AGE_VERIFIED_COOKIE,
  createAgeVerifiedCookie,
} from "@/lib/auth/age-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  logFailedAgeVerification,
  persistAgeVerificationInBackground,
  validateAgeVerificationRequest,
} from "@/services/user/compliance";

const bodySchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
  rememberDevice: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`verify-age:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification data." }, { status: 400 });
  }

  const validated = validateAgeVerificationRequest(parsed.data);
  if (!validated.ok) {
    logFailedAgeVerification({
      reason: validated.error,
      ipAddress: ip,
      rememberDevice: parsed.data.rememberDevice,
    });
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const cookie = await createAgeVerifiedCookie(parsed.data.rememberDevice);
  const response = NextResponse.json({ ok: true, redirect: true });
  response.cookies.set(
    AGE_VERIFIED_COOKIE,
    cookie.value,
    ageVerifiedCookieOptions(cookie.maxAge, process.env.NODE_ENV === "production"),
  );

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET }).catch(() => null);
  persistAgeVerificationInBackground({
    userId: typeof token?.sub === "string" ? token.sub : undefined,
    dateOfBirth: validated.date,
    ipAddress: ip,
    rememberDevice: parsed.data.rememberDevice,
  });

  return response;
}
