export function isVendorAgeVerificationConfigured() {
  return Boolean(process.env.AGE_VERIFICATION_PROVIDER && process.env.AGE_VERIFICATION_API_KEY);
}

export function isUserVendorAgeVerified(method: string | null | undefined) {
  return Boolean(method && method.startsWith("veriff"));
}

/** Block DOB-only self-attestation when strict mode is active. */
export function isStrictAgeVerificationEnabled() {
  if (process.env.AGE_VERIFICATION_STRICT === "true") return true;
  if (
    process.env.NODE_ENV === "production" &&
    isVendorAgeVerificationConfigured() &&
    process.env.AGE_VERIFICATION_ALLOW_SELF_ATTESTATION !== "true"
  ) {
    return true;
  }
  return false;
}

export function isSelfAttestationAllowed() {
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.AGE_VERIFICATION_ALLOW_SELF_ATTESTATION === "true") return true;
  return !isStrictAgeVerificationEnabled();
}

export function requiresSignedInAgeVerification() {
  return isStrictAgeVerificationEnabled() && isVendorAgeVerificationConfigured();
}
