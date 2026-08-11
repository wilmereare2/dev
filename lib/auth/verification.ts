import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { createEmailVerificationCode } from "@/lib/auth/verification-codes";
import { allowDevVerificationFallback } from "@/lib/auth/verification-delivery";
import { sendVerificationCodeEmail } from "@/lib/email/send-verification-code-email";
import { emailWasDelivered } from "@/lib/email/send-email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function linkIdentifier(email: string) {
  return `email-link:${email.trim().toLowerCase()}`;
}

export async function createEmailVerificationToken(email: string) {
  const identifier = linkIdentifier(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function verifyEmailToken(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: { in: [linkIdentifier(email), normalizedEmail] },
    },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid verification link." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier, token },
    });
    return { ok: false as const, error: "This verification link has expired." };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { ok: false as const, error: "Account not found." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: [record.identifier, linkIdentifier(email), `email-code:${normalizedEmail}`],
        },
      },
    }),
  ]);

  return { ok: true as const };
}

export async function sendVerificationEmailForUser(email: string, appUrl?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return { ok: false as const, error: "No account found for this email." };
  }

  if (user.emailVerified) {
    return { ok: false as const, error: "This email is already verified." };
  }

  const code = await createEmailVerificationCode(normalizedEmail);
  let verifyUrl: string | undefined;

  if (allowDevVerificationFallback()) {
    const token = await createEmailVerificationToken(normalizedEmail);
    const { buildVerificationUrl } = await import("@/lib/email/send-verification-email");
    verifyUrl = buildVerificationUrl(normalizedEmail, token, appUrl);
  }

  const emailResult = await sendVerificationCodeEmail({
    email: normalizedEmail,
    code,
    name: user.name,
    verifyUrl,
  });

  const delivered = emailWasDelivered(emailResult);

  const deliveryError = delivered
    ? undefined
    : !emailResult.ok
      ? emailResult.error
      : "Email could not be delivered. Check Resend domain verification and redeploy after updating Vercel env vars.";

  return {
    ok: true as const,
    sent: delivered,
    codeSent: delivered,
    deliveryError,
    verifyUrl: allowDevVerificationFallback() && !delivered ? verifyUrl : undefined,
  };
}

export { verifyEmailVerificationCode } from "@/lib/auth/verification-codes";
