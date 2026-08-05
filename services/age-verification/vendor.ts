type VendorResult = {
  ok: boolean;
  referenceId?: string;
  error?: string;
};

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

      const payload = (await response.json()) as { verification?: { id?: string; url?: string } };
      return { ok: true, referenceId: payload.verification?.id };
    } catch {
      return { ok: false, error: "Veriff request failed." };
    }
  }

  return { ok: false, error: `Unsupported provider: ${provider}` };
}

export async function markVendorAgeVerified(userId: string, method: string) {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ageVerifiedAt: new Date(),
      ageVerificationMethod: method,
    },
    update: {
      ageVerifiedAt: new Date(),
      ageVerificationMethod: method,
    },
  });
}
