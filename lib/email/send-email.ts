import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendEmailResult =
  | { ok: true; provider: "resend" | "smtp" }
  | { ok: true; dev: true; deliveryFailed?: true }
  | { ok: false; error: string };

function createTransport() {
  const server = process.env.EMAIL_SERVER;
  if (!server) return null;
  return nodemailer.createTransport(server);
}

async function sendViaResend(input: SendEmailInput, from: string): Promise<SendEmailResult | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[email] Resend delivery failed:", detail);

    let message = "Resend rejected the message. Verify manuelax.com in Resend and set EMAIL_FROM to that domain.";
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) {
        message = parsed.message;
        if (/only send testing emails/i.test(parsed.message)) {
          message +=
            " Until your domain is verified, use EMAIL_FROM=onboarding@resend.dev and register with your Resend account email.";
        }
      }
    } catch {
      // Keep default message when Resend returns non-JSON.
    }

    return { ok: false, error: message };
  }

  return { ok: true, provider: "resend" };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM ?? "noreply@localhost";

  const resendResult = await sendViaResend(input, from);
  if (resendResult?.ok) return resendResult;
  if (resendResult && !resendResult.ok) {
    if (process.env.NODE_ENV === "production") return resendResult;
  }

  const transport = createTransport();

  if (!transport) {
    console.warn("[email] No RESEND_API_KEY or EMAIL_SERVER configured.");
    console.info(`[email] To: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n`);
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error:
          "Email is not configured. Add RESEND_API_KEY in Vercel, redeploy, and verify your domain in Resend.",
      };
    }
    return { ok: true, dev: true };
  }

  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, provider: "smtp" };
  } catch (error) {
    console.error("[email] SMTP delivery failed:", error);
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "SMTP delivery failed. Check EMAIL_SERVER and EMAIL_FROM." };
    }
    return { ok: true, dev: true, deliveryFailed: true };
  }
}

export function emailWasDelivered(result: SendEmailResult) {
  return result.ok && !("dev" in result && result.dev);
}
