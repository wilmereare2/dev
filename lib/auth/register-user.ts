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
    if (existing.emailVerified) {
      return {
        ok: false as const,
        code: "ALREADY_REGISTERED" as const,
        error: "This email is already registered. Sign in to continue.",
      };
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: await hashPassword(input.password),
        ...(input.name?.trim() ? { name: input.name.trim() } : {}),
      },
    });

    const sendResult = await sendVerificationEmailForUser(email, appUrl).catch((error) => {
      console.error("[register] verification email failed:", error);
      return { ok: false as const, error: "Could not send verification email." };
    });
    return {
      ok: true as const,
      email,
      devAutoVerified: false,
      userId: existing.id,
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
    devAutoVerified,
    userId: created.id,
    verifyUrl,
    emailSent,
    deliveryError,
  };
}
