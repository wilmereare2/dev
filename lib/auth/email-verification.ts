import { prisma } from "@/lib/db/prisma";

/**
 * Email verification is optional at sign-up.
 *
 * An unverified member can sign in, browse, and view everything the platform
 * publishes itself. Verification is required only for the features below, and
 * is checked at the point of use rather than at the door:
 *
 *  - the notification channel
 *  - posts promoted by other members
 *
 * Keeping the rules here means there is one place to read them, and one place
 * to change them.
 */
export const EMAIL_VERIFICATION_GATED_FEATURES = {
  notifications: "notifications",
  memberPosts: "memberPosts",
} as const;

export type EmailVerificationGatedFeature =
  (typeof EMAIL_VERIFICATION_GATED_FEATURES)[keyof typeof EMAIL_VERIFICATION_GATED_FEATURES];

export const EMAIL_VERIFICATION_MESSAGES: Record<EmailVerificationGatedFeature, string> = {
  notifications: "Verify your email to turn on notifications.",
  memberPosts: "Verify your email to view posts promoted by other members.",
};

/** True when the user has confirmed their email address. */
export async function hasVerifiedEmail(userId?: string | null) {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return Boolean(user?.emailVerified);
}

export type EmailVerificationCheck =
  | { allowed: true }
  | { allowed: false; reason: "sign_in" | "email_verification"; message: string };

/**
 * Guards a feature that requires a verified email. Signed-out visitors are
 * told to sign in; signed-in but unverified members are told to verify.
 */
export async function requireVerifiedEmail(
  userId: string | null | undefined,
  feature: EmailVerificationGatedFeature,
): Promise<EmailVerificationCheck> {
  if (!userId) {
    return { allowed: false, reason: "sign_in", message: "Sign in to continue." };
  }
  if (await hasVerifiedEmail(userId)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "email_verification",
    message: EMAIL_VERIFICATION_MESSAGES[feature],
  };
}
