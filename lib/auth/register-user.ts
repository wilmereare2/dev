import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { isDesignatedAdminEmail } from "@/lib/auth/admin-email";
import { provisionAdministrator } from "@/lib/auth/provision-admin";
import { sendVerificationEmailForUser } from "@/lib/auth/verification";

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export async function registerUser(input: RegisterInput, appUrl?: string) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return {
      ok: false as const,
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  const devAutoVerified = process.env.NODE_ENV === "development";
  const assignAdmin = isDesignatedAdminEmail(email);

  const created = await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      passwordHash: await hashPassword(input.password),
      role: assignAdmin ? "ADMIN" : "USER",
      emailVerified: devAutoVerified || assignAdmin ? new Date() : null,
      settings: { create: {} },
    },
  });

  if (assignAdmin) {
    await provisionAdministrator(created.id);
  }

  let verifyUrl: string | undefined;
  let emailSent = false;

  if (!devAutoVerified) {
    const sendResult = await sendVerificationEmailForUser(email, appUrl);
    verifyUrl = sendResult.ok ? sendResult.verifyUrl : undefined;
    emailSent = sendResult.ok ? sendResult.sent : false;
  } else {
    console.info(`[dev] Auto-verified ${email}. Sign in is enabled immediately.`);
  }

  return {
    ok: true as const,
    email,
    devAutoVerified,
    userId: created.id,
    verifyUrl,
    emailSent,
  };
}
