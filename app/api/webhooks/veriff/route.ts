import { NextResponse } from "next/server";
import {
  markVendorAgeVerified,
  parseVeriffWebhook,
  verifyVeriffWebhook,
} from "@/services/age-verification/vendor";
import { logAgeVerificationAttempt, recordTermsAcceptanceForUser } from "@/services/user/compliance";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hmac-signature");

  if (!verifyVeriffWebhook(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { status, userId, referenceId } = parseVeriffWebhook(body);
  if (!userId) {
    return NextResponse.json({ error: "Missing user reference." }, { status: 400 });
  }

  if (status === "approved") {
    await markVendorAgeVerified(userId, "veriff", referenceId || undefined);
    await recordTermsAcceptanceForUser(userId).catch(() => undefined);
    await logAgeVerificationAttempt({
      userId,
      success: true,
      reason: "veriff-approved",
    });
    return NextResponse.json({ ok: true });
  }

  if (status === "declined" || status === "expired" || status === "abandoned") {
    await logAgeVerificationAttempt({
      userId,
      success: false,
      reason: `veriff-${status}`,
    });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
