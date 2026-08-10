import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ageVerifiedCookieOptions,
  AGE_VERIFIED_COOKIE,
  createAgeVerifiedCookie,
} from "@/lib/auth/age-cookie";
import { requireApiUser } from "@/lib/api/require-user";
import { getComplianceStatus } from "@/services/user/compliance";

const bodySchema = z.object({
  rememberDevice: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const compliance = await getComplianceStatus(authResult.userId);
  if (!compliance.ageVerified) {
    return NextResponse.json({ error: "Age verification required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const rememberDevice = parsed.success ? parsed.data.rememberDevice : true;

  const cookie = await createAgeVerifiedCookie(rememberDevice);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    AGE_VERIFIED_COOKIE,
    cookie.value,
    ageVerifiedCookieOptions(cookie.maxAge, process.env.NODE_ENV === "production"),
  );

  return response;
}
