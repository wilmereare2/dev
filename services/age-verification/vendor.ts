import crypto from "crypto";

type VendorResult = {
  ok: boolean;
  referenceId?: string;
  verificationUrl?: string;
  error?: string;
};

export function isVeriffProvider() {
  return process.env.AGE_VERIFICATION_PROVIDER === "veriff";
}

export function verifyVeriffWebhook(payload: string, signature: string | null) {
  const secret = process.env.AGE_VERIFICATION_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function parseVeriffWebhook(body: Record<string, unknown>) {
  const verification = body.verification as Record<string, unknown> | undefined;
  const status = String(verification?.status ?? body.status ?? "").toLowerCase();
  const userId = String(verification?.vendorData ?? body.vendorData ?? "");
  const referenceId = String(verification?.id ?? body.id ?? "");

  return { status, userId, referenceId };
}

export async function startVendorAgeVerification(input: {
  userId: string;
  email: string;
  returnUrl: string;
}): Promise<VendorResult> {
  const provider = process.env.AGE_VERIFICATION_PROVIDER;
  const apiKey = process.env.AGE_VERIFICATION_API_KEY;

  if (!provider || !apiKey) {
    return { ok: false, error: "Age verification vendor is not configured." };
  }

  if (provider === "veriff") {
    try {
      const response = await fetch("https://stationapi.veriff.com/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AUTH-CLIENT": apiKey,
        },
        body: JSON.stringify({
          verification: {
            callback: input.returnUrl,
            vendorData: input.userId,
          },
        }),
      });

      if (!response.ok) {
        return { ok: false, error: "Could not start Veriff session." };
      }

      const payload = (await response.json()) as {
        verification?: { id?: string; url?: string };
      };
      const referenceId = payload.verification?.id;
      const verificationUrl = payload.verification?.url;

      if (!referenceId || !verificationUrl) {
        return { ok: false, error: "Veriff session did not return a verification URL." };
      }

      return { ok: true, referenceId, verificationUrl };
    } catch {
      return { ok: false, error: "Veriff request failed." };
    }
  }

  return { ok: false, error: `Unsupported provider: ${provider}` };
}

export async function markVendorAgeVerified(userId: string, method: string, referenceId?: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ageVerifiedAt: new Date(),
      ageVerificationMethod: referenceId ? `${method}:${referenceId}` : method,
    },
    update: {
      ageVerifiedAt: new Date(),
      ageVerificationMethod: referenceId ? `${method}:${referenceId}` : method,
    },
  });
}
