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

function buildProfileFields(input: RegisterProfileInput, phone: string) {
  return {
    username: normalizeUsername(input.username),
    name: input.name.trim(),
    gender: input.gender.trim(),
    country: input.country.trim(),
    race: input.race.trim(),
    hobbies: input.hobbies.trim(),
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
  const phone = normalizePhoneNumber(input.phone);
  if (!phone) {
    return { ok: false as const, code: "INVALID_PHONE" as const, error: "Enter a valid phone number with country code." };
  }

  const dobResult = parseDateOfBirth(input.dateOfBirth);
  if (!dobResult.ok) {
    return { ok: false as const, code: "INVALID_DOB" as const, error: dobResult.error };
  }

  const [existingEmail, existingUsername, existingPhone] = await withDbRetry(() =>
    Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { phone } }),
    ]),
  );

  if (existingUsername && existingUsername.email !== email) {
    return { ok: false as const, code: "USERNAME_TAKEN" as const, error: "That username is already taken." };
  }

  if (existingPhone && existingPhone.email !== email) {
    return { ok: false as const, code: "PHONE_TAKEN" as const, error: "That phone number is already linked to another account." };
  }

  const profileFields = buildProfileFields(input, phone);
  const passwordHash = await hashPassword(input.password);

  if (existingEmail) {
    if (existingEmail.emailVerified) {
      return {
        ok: false as const,
        code: "ALREADY_REGISTERED" as const,
        error: "This email is already registered. Sign in to continue.",
      };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existingEmail.id },
        data: { ...profileFields, passwordHash, phoneVerified: null },
      }),
      prisma.userSettings.upsert({
        where: { userId: existingEmail.id },
        create: { userId: existingEmail.id, dateOfBirth: dobResult.date },
        update: { dateOfBirth: dobResult.date },
      }),
    ]);

    const sendResult = await sendVerificationEmailForUser(email, appUrl).catch((error) => {
      console.error("[register] verification email failed:", error);
      return { ok: false as const, error: "Could not send verification email." };
    });
    return {
      ok: true as const,
      email,
      username,
      devAutoVerified: false,
      userId: existingEmail.id,
      verifyUrl: sendResult.ok ? sendResult.verifyUrl : undefined,
      emailSent: sendResult.ok ? sendResult.sent : false,
      deliveryError: sendResult.ok ? sendResult.deliveryError : sendResult.error,
      resumed: true as const,
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
      phoneVerified: devAutoVerified || assignAdmin ? new Date() : null,
      settings: { create: { dateOfBirth: dobResult.date } },
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
