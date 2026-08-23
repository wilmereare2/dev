import { isSmsVerificationConfigured } from "@/lib/auth/verification-delivery";

/** When true, users with a phone on file must verify it before signing in. */
export function isPhoneVerificationRequired() {
  return process.env.REQUIRE_PHONE_VERIFICATION === "true";
}

/** When true, offer SMS verification after email verification during registration. */
export function isPhoneVerificationOffered() {
  return (
    isPhoneVerificationRequired() ||
    process.env.NEXT_PUBLIC_PHONE_VERIFICATION === "true" ||
    isSmsVerificationConfigured()
  );
}
