import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send-email";

type SendVerificationEmailInput = {
  email: string;
  token: string;
  name?: string | null;
  appUrl?: string;
};

function getAppUrl(appUrl?: string) {
  return appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildVerificationUrl(email: string, token: string, appUrl?: string) {
  const params = new URLSearchParams({
    email,
    token,
  });
  return `${getAppUrl(appUrl)}/api/auth/verify-email?${params.toString()}`;
}

export async function sendVerificationEmail(input: SendVerificationEmailInput) {
  const verifyUrl = buildVerificationUrl(input.email, input.token, input.appUrl);
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";

  const text = [
    greeting,
    "",
    `Thanks for signing up for ${APP_NAME}. Confirm your email address to activate your account:`,
    verifyUrl,
    "",
    "This link expires in 24 hours.",
    "",
    `If you did not create a ${APP_NAME} account, you can ignore this email.`,
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Thanks for signing up for <strong>${APP_NAME}</strong>. Confirm your email address to activate your account:</p>
    <p><a href="${verifyUrl}">Verify email address</a></p>
    <p>Or copy this link into your browser:<br /><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you did not create a ${APP_NAME} account, you can ignore this email.</p>
  `.trim();

  return sendEmail({
    to: input.email,
    subject: `Verify your ${APP_NAME} email`,
    html,
    text,
  });
}
