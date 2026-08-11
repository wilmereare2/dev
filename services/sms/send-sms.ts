import { isSmsVerificationConfigured } from "@/lib/auth/verification-delivery";

export async function sendSmsVerificationCode(phone: string, code: string) {
  if (!isSmsVerificationConfigured()) {
    return { ok: false as const, error: "SMS verification is not configured." };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_PHONE_NUMBER!;

  const body = new URLSearchParams({
    To: phone.startsWith("+") ? phone : `+${phone}`,
    From: from,
    Body: `Your manuelaX verification code is ${code}. It expires in 10 minutes.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[sms] Twilio delivery failed:", detail);
    return { ok: false as const, error: "Could not send text message. Try again later." };
  }

  return { ok: true as const };
}
