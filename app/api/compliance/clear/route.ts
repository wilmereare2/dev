import { NextResponse } from "next/server";
import { AGE_VERIFIED_COOKIE, clearAgeVerifiedCookieOptions } from "@/lib/auth/age-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    AGE_VERIFIED_COOKIE,
    "",
    clearAgeVerifiedCookieOptions(process.env.NODE_ENV === "production"),
  );
  return response;
}
