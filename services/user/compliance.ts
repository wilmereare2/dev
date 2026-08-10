import { validateAgeVerificationInput } from "@/lib/compliance/age-rules";
import { prisma } from "@/lib/db/prisma";

export { MIN_AGE_YEARS, calculateAge, formatDateOfBirthInput, isAdult, parseDateOfBirth, parseDisplayDateOfBirth, toIsoDateString, validateAgeVerificationInput } from "@/lib/compliance/age-rules";

export const CURRENT_TERMS_VERSION = "2026-01";
export const CURRENT_PRIVACY_VERSION = "2026-01";

export async function getComplianceStatus(userId: string) {
  const [settings, latestTerms] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.termsAcceptance.findFirst({
      where: { userId },
      orderBy: { acceptedAt: "desc" },
    }),
  ]);

  const ageVerified = Boolean(settings?.ageVerifiedAt && settings.dateOfBirth);
  const termsAccepted =
    latestTerms?.termsVersion === CURRENT_TERMS_VERSION &&
    latestTerms?.privacyVersion === CURRENT_PRIVACY_VERSION;

  return {
    ageVerified,
    termsAccepted,
    compliant: ageVerified && termsAccepted,
    dateOfBirth: settings?.dateOfBirth ?? null,
    ageVerifiedAt: settings?.ageVerifiedAt ?? null,
  };
}

export async function logAgeVerificationAttempt(input: {
  userId?: string;
  success: boolean;
  reason?: string;
  ipAddress?: string;
  rememberDevice?: boolean;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.userId ?? null,
      action: input.success ? "age_verification_success" : "age_verification_failed",
      entity: "age_verification",
      meta: JSON.stringify({
        reason: input.reason ?? null,
        ipAddress: input.ipAddress ?? null,
        rememberDevice: input.rememberDevice ?? false,
      }),
    },
  });
}

async function persistUserVerification(userId: string, dateOfBirth: Date, ipAddress?: string) {
  await prisma.$transaction([
    prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth,
        ageVerifiedAt: new Date(),
        ageVerificationMethod: "dob-self-attestation",
      },
      update: {
        dateOfBirth,
        ageVerifiedAt: new Date(),
        ageVerificationMethod: "dob-self-attestation",
      },
    }),
    prisma.termsAcceptance.create({
      data: {
        userId,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);
}

/** Validates input only — fast, no database. */
export function validateAgeVerificationRequest(input: {
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}) {
  return validateAgeVerificationInput(input);
}

/** Persist verification for signed-in users without blocking the age cookie. */
export function persistAgeVerificationInBackground(input: {
  userId?: string;
  dateOfBirth: Date;
  ipAddress?: string;
  rememberDevice?: boolean;
}) {
  void logAgeVerificationAttempt({
    userId: input.userId,
    success: true,
    ipAddress: input.ipAddress,
    rememberDevice: input.rememberDevice,
  }).catch(() => undefined);

  if (!input.userId) return;

  void persistUserVerification(input.userId, input.dateOfBirth, input.ipAddress).catch(() => undefined);
}

export function logFailedAgeVerification(input: {
  userId?: string;
  reason: string;
  ipAddress?: string;
  rememberDevice?: boolean;
}) {
  void logAgeVerificationAttempt({
    userId: input.userId,
    success: false,
    reason: input.reason,
    ipAddress: input.ipAddress,
    rememberDevice: input.rememberDevice,
  }).catch(() => undefined);
}

/** @deprecated Use validateAgeVerificationRequest + persistAgeVerificationInBackground */
export async function verifyAgeAndTerms(input: {
  userId?: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  ipAddress?: string;
  rememberDevice?: boolean;
}) {
  const validated = validateAgeVerificationRequest(input);
  if (!validated.ok) {
    logFailedAgeVerification({
      userId: input.userId,
      reason: validated.error,
      ipAddress: input.ipAddress,
      rememberDevice: input.rememberDevice,
    });
    return { ok: false as const, error: validated.error };
  }

  persistAgeVerificationInBackground({
    userId: input.userId,
    dateOfBirth: validated.date,
    ipAddress: input.ipAddress,
    rememberDevice: input.rememberDevice,
  });

  return { ok: true as const, dateOfBirth: validated.date };
}
