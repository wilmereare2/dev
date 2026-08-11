import { randomInt } from "crypto";
import { prisma } from "@/lib/db/prisma";

const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const PHONE_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function emailCodeIdentifier(email: string) {
  return `email-code:${email.trim().toLowerCase()}`;
}

function phoneCodeIdentifier(phone: string) {
  return `phone-code:${phone.replace(/\D/g, "")}`;
}

export function generateVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export function normalizePhoneNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function createEmailVerificationCode(email: string) {
  const identifier = emailCodeIdentifier(email);
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + EMAIL_CODE_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: code, expires },
  });

  return code;
}

export async function verifyEmailVerificationCode(email: string, code: string) {
  const identifier = emailCodeIdentifier(email);
  const normalized = code.replace(/\D/g, "").trim();
  if (normalized.length !== 6) {
    return { ok: false as const, error: "Enter the 6-digit code from your email." };
  }

  const records = await prisma.verificationToken.findMany({
    where: { identifier },
    orderBy: { expires: "desc" },
    take: MAX_ATTEMPTS,
  });

  const match = records.find((record) => record.token === normalized);
  if (!match) {
    return { ok: false as const, error: "Invalid verification code." };
  }

  if (match.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false as const, error: "This code has expired. Request a new one." };
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return { ok: true as const };
}

export async function createPhoneVerificationCode(phone: string) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return { ok: false as const, error: "Enter a valid phone number with country code." };
  }

  const identifier = phoneCodeIdentifier(normalized);
  const code = generateVerificationCode();
  const expires = new Date(Date.now() + PHONE_CODE_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: code, expires },
  });

  return { ok: true as const, phone: normalized, code };
}

export async function verifyPhoneVerificationCode(email: string, phone: string, code: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    return { ok: false as const, error: "Enter a valid phone number." };
  }

  const normalizedCode = code.replace(/\D/g, "").trim();
  if (normalizedCode.length !== 6) {
    return { ok: false as const, error: "Enter the 6-digit code from your text message." };
  }

  const identifier = phoneCodeIdentifier(normalizedPhone);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: normalizedCode },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid verification code." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false as const, error: "This code has expired. Request a new one." };
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { phone: normalizedPhone, phoneVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return { ok: true as const };
}
