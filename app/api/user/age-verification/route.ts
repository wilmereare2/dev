import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import {
  isStrictAgeVerificationEnabled,
  isVendorAgeVerificationConfigured,
} from "@/lib/compliance/age-verification-policy";
import { startVendorAgeVerification } from "@/services/age-verification/vendor";

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  if (!isVendorAgeVerificationConfigured()) {
    return NextResponse.json({ error: "Age verification vendor is not configured." }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const { prisma } = await import("@/lib/db/prisma");
  const user = await prisma.user.findUnique({ where: { id: authResult.userId } });

  if (!user?.email) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const result = await startVendorAgeVerification({
    userId: authResult.userId,
    email: user.email,
    returnUrl: `${appUrl}/verify-age?vendor=complete`,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: isStrictAgeVerificationEnabled() ? "STRICT_AGE_VERIFICATION" : "VENDOR_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    referenceId: result.referenceId,
    verificationUrl: result.verificationUrl,
  });
}
