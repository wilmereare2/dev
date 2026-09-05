import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { isDesignatedAdminEmail } from "@/lib/auth/admin-email";
import { provisionAdministrator } from "@/lib/auth/provision-admin";
import { sendVerificationEmailForUser } from "@/lib/auth/verification";
import { normalizePhoneNumber } from "@/lib/auth/verification-codes";
import { parseDateOfBirth } from "@/lib/compliance/age-rules";
import { mapPrismaErrorMessage } from "@/lib/db/prisma-error-message";
import { databaseUnavailableMessage, withDbRetry } from "@/lib/db/connection-error";
import type { RegisterProfileInput } from "@/lib/user/register-schema";
import { normalizeUsername } from "@/lib/user/username";

/**
 * Only the username is guaranteed at sign-up. Profile details are optional and
 * stay null until the member fills them in from settings, so `undefined` here
 * means "not provided yet" rather than "cleared".
 */
function buildProfileFields(input: RegisterProfileInput, phone: string | null) {
  const username = normalizeUsername(input.username);
  return {
    username,
    // Display name falls back to the username so the UI always has a label.
    name: input.name?.trim() || username,
    gender: input.gender?.trim() || null,
    country: input.country?.trim() || null,
    race: input.race?.trim() || null,
    hobbies: input.hobbies?.trim() || null,
    phone,
    telegram: input.telegram?.trim() || null,
    whatsApp: input.whatsApp?.trim() || null,
    zangi: input.zangi?.trim() || null,
  };
}

export async function registerUser(input: RegisterProfileInput, appUrl?: string) {
  try {
    return await registerUserInternal(input, appUrl);
  } catch (error) {
    console.error("[registerUser]", error);
    return {
      ok: false as const,
      code: "SERVER_ERROR" as const,
      error: mapPrismaErrorMessage(error, {
        fallback: "Could not create account. Try again in a moment.",
        connectionMessage: databaseUnavailableMessage(),
      }),
    };
  }
}

async function registerUserInternal(input: RegisterProfileInput, appUrl?: string) {
  const email = input.email.trim().toLowerCase();
  const username = normalizeUsername(input.username);
  const phoneInput = input.phone.trim();
  const phone = phoneInput ? normalizePhoneNumber(phoneInput) : null;
  if (phoneInput && !phone) {
    return { ok: false as const, code: "INVALID_PHONE" as const, error: "Enter a valid phone number with country code." };
  }

  // Age eligibility is enforced by the age gate before any page renders, so a
  // date of birth at sign-up is optional. When given it is still validated.
  let dateOfBirth: Date | null = null;
  if (input.dateOfBirth) {
    const dobResult = parseDateOfBirth(input.dateOfBirth);
    if (!dobResult.ok) {
      return { ok: false as const, code: "INVALID_DOB" as const, error: dobResult.error };
    }
    dateOfBirth = dobResult.date;
  }

  const [existingEmail, existingUsername, existingPhone] = await withDbRetry(async () => {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    const byUsername = await prisma.user.findUnique({ where: { username } });
    const byPhone = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
    return [byEmail, byUsername, byPhone] as const;
  });

  if (existingUsername) {
    return { ok: false as const, code: "USERNAME_TAKEN" as const, error: "That username is already taken." };
  }

  if (existingPhone) {
    return { ok: false as const, code: "PHONE_TAKEN" as const, error: "That phone number is already linked to another account." };
  }

  const profileFields = buildProfileFields(input, phone);
  const passwordHash = await hashPassword(input.password);

  // Any account on this email is now final. Sign-in no longer requires a
  // verified email, so silently overwriting an existing unverified account's
  // password here would let anyone claim someone else's registered address and
  // sign in as them. Unfinished sign-ups recover via sign-in or password reset.
  if (existingEmail) {
    return {
      ok: false as const,
      code: "ALREADY_REGISTERED" as const,
      error: "This email is already registered. Sign in to continue.",
    };
  }


  const devAutoVerified = process.env.NODE_ENV === "development";
  const assignAdmin = isDesignatedAdminEmail(email);

  const created = await prisma.user.create({
    data: {
      email,
      ...profileFields,
      passwordHash,
      role: assignAdmin ? "ADMIN" : "USER",
      emailVerified: devAutoVerified || assignAdmin ? new Date() : null,
      phoneVerified: (devAutoVerified || assignAdmin) && phone ? new Date() : null,
      settings: { create: { dateOfBirth } },
    },
  });

  if (assignAdmin) {
    await provisionAdministrator(created.id);
  }

  let verifyUrl: string | undefined;
  let emailSent = false;
  let deliveryError: string | undefined;

  if (!devAutoVerified) {
    try {
      const sendResult = await sendVerificationEmailForUser(email, appUrl);
      verifyUrl = sendResult.ok ? sendResult.verifyUrl : undefined;
      emailSent = sendResult.ok ? sendResult.sent : false;
      deliveryError = sendResult.ok ? sendResult.deliveryError : undefined;
    } catch (error) {
      console.error("[register] verification email failed:", error);
    }
  } else {
    console.info(`[dev] Auto-verified ${email}. Sign in is enabled immediately.`);
  }

  return {
    ok: true as const,
    email,
    username,
    devAutoVerified,
    userId: created.id,
    verifyUrl,
    emailSent,
    deliveryError,
  };
}
