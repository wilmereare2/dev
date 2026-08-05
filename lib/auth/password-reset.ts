import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { buildPasswordResetUrl, sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function resetIdentifier(email: string) {
  return `password-reset:${email.trim().toLowerCase()}`;
}

export async function createPasswordResetToken(email: string) {
  const identifier = resetIdentifier(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function resetPasswordWithToken(input: {
  email: string;
  token: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const identifier = resetIdentifier(email);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: input.token },
  });

  if (!record) {
    return { ok: false as const, error: "This reset link is invalid or expired." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier, token: input.token } });
    return { ok: false as const, error: "This reset link has expired. Request a new one." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.password) },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: input.token } },
    }),
  ]);

  return { ok: true as const };
}

export async function sendPasswordResetEmailForUser(email: string, appUrl?: string) {
  const identifier = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: identifier } });

  if (!user?.passwordHash) {
    return { ok: true as const, sent: false as const };
  }

  const token = await createPasswordResetToken(identifier);
  const resetUrl = buildPasswordResetUrl(identifier, token, appUrl);
  const emailResult = await sendPasswordResetEmail({
    email: identifier,
    token,
    name: user.name,
    appUrl,
  });

  return {
    ok: true as const,
    sent: true as const,
    resetUrl: "dev" in emailResult && emailResult.dev ? resetUrl : undefined,
  };
}
