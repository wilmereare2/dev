import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { startVendorAgeVerification } from "@/services/age-verification/vendor";

export async function POST() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json(result);
}
