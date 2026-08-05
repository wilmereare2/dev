import { NextResponse } from "next/server";
import { z } from "zod";
import { sendVerificationEmailForUser, verifyEmailToken } from "@/lib/auth/verification";

const querySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: searchParams.get("email"),
    token: searchParams.get("token"),
  });

  const redirectBase = new URL("/account", request.url);

  if (!parsed.success) {
    redirectBase.searchParams.set("error", "invalid-verification-link");
    return NextResponse.redirect(redirectBase);
  }

  const result = await verifyEmailToken(parsed.data.email, parsed.data.token);
  if (!result.ok) {
    redirectBase.searchParams.set("error", "verification-failed");
    redirectBase.searchParams.set("email", parsed.data.email);
    return NextResponse.redirect(redirectBase);
  }

  redirectBase.searchParams.set("verified", "1");
  return NextResponse.redirect(redirectBase);
}
