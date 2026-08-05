import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send-email";

type SendPasswordResetEmailInput = {
  email: string;
  token: string;
  name?: string | null;
  appUrl?: string;
};

function getAppUrl(appUrl?: string) {
  return appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildPasswordResetUrl(email: string, token: string, appUrl?: string) {
  const params = new URLSearchParams({ email, token });
  return `${getAppUrl(appUrl)}/account/reset-password?${params.toString()}`;
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const resetUrl = buildPasswordResetUrl(input.email, input.token, input.appUrl);
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";

  const text = [
    greeting,
    "",
    `We received a request to reset your ${APP_NAME} password.`,
    resetUrl,
    "",
    "This link expires in 1 hour.",
    "",
    `If you did not request this, you can ignore this email.`,
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>We received a request to reset your <strong>${APP_NAME}</strong> password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>Or copy this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  return sendEmail({
    to: input.email,
    subject: `Reset your ${APP_NAME} password`,
    html,
    text,
  });
}
