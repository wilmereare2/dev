/** On-screen verification links are for local dev only — never on production. */
export function allowDevVerificationFallback() {
  return process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_VERIFY_LINK !== "false";
}

export function isSmsVerificationConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

export function isEmailDeliveryRequired() {
  return process.env.NODE_ENV === "production" || process.env.REQUIRE_EMAIL_DELIVERY === "true";
}
