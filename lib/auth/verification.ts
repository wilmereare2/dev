import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerificationToken(email: string) {
  const identifier = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function verifyEmailToken(email: string, token: string) {
  const identifier = email.trim().toLowerCase();
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid verification link." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier, token } });
    return { ok: false as const, error: "This verification link has expired." };
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } });
  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    }),
  ]);

  return { ok: true as const };
}

export async function sendVerificationEmailForUser(email: string, appUrl?: string) {
  const identifier = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: identifier } });

  if (!user) {
    return { ok: false as const, error: "No account found for this email." };
  }

  if (user.emailVerified) {
    return { ok: false as const, error: "This email is already verified." };
  }

  const token = await createEmailVerificationToken(identifier);
  const { sendVerificationEmail } = await import("@/lib/email/send-verification-email");
  await sendVerificationEmail({ email: identifier, token, name: user.name, appUrl });

  return { ok: true as const };
}
