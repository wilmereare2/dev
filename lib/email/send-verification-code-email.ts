import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send-email";

type SendVerificationCodeEmailInput = {
  email: string;
  code: string;
  name?: string | null;
  verifyUrl?: string;
};

export async function sendVerificationCodeEmail(input: SendVerificationCodeEmailInput) {
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";
  const linkLine = input.verifyUrl
    ? `\nOr verify using this link:\n${input.verifyUrl}\n`
    : "";

  const text = [
    greeting,
    "",
    `Your ${APP_NAME} verification code is: ${input.code}`,
    "",
    "Enter this code on the site to activate your account. It expires in 10 minutes.",
    linkLine,
    "",
    `If you did not create a ${APP_NAME} account, you can ignore this email.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p>${greeting}</p>
    <p>Your <strong>${APP_NAME}</strong> verification code is:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;margin:16px 0">${input.code}</p>
    <p>Enter this code on the site to activate your account. It expires in 10 minutes.</p>
    ${
      input.verifyUrl
        ? `<p>Or <a href="${input.verifyUrl}">verify using this link</a>.</p>`
        : ""
    }
    <p>If you did not create a ${APP_NAME} account, you can ignore this email.</p>
  `.trim();

  return sendEmail({
    to: input.email,
    subject: `${input.code} is your ${APP_NAME} verification code`,
    html,
    text,
  });
}
