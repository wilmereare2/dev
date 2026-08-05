import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function createTransport() {
  const server = process.env.EMAIL_SERVER;
  if (!server) return null;
  return nodemailer.createTransport(server);
}

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM ?? "noreply@localhost";
  const transport = createTransport();

  if (!transport) {
    console.warn("[email] EMAIL_SERVER is not configured; message was not delivered.");
    console.info(
      `[email] To: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n`,
    );
    return { ok: true as const, dev: true as const };
  }

  await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { ok: true as const };
}
