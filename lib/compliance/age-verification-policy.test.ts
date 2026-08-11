import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSelfAttestationAllowed,
  isStrictAgeVerificationEnabled,
  isUserVendorAgeVerified,
  isVendorAgeVerificationConfigured,
  requiresSignedInAgeVerification,
} from "@/lib/compliance/age-verification-policy";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("age-verification-policy", () => {
  it("detects vendor configuration", () => {
    vi.stubEnv("AGE_VERIFICATION_PROVIDER", "veriff");
    vi.stubEnv("AGE_VERIFICATION_API_KEY", "key");
    expect(isVendorAgeVerificationConfigured()).toBe(true);
  });

  it("allows self-attestation in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isSelfAttestationAllowed()).toBe(true);
  });

  it("blocks self-attestation in production when Veriff is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGE_VERIFICATION_PROVIDER", "veriff");
    vi.stubEnv("AGE_VERIFICATION_API_KEY", "key");
    delete process.env.AGE_VERIFICATION_ALLOW_SELF_ATTESTATION;
    expect(isStrictAgeVerificationEnabled()).toBe(true);
    expect(isSelfAttestationAllowed()).toBe(false);
  });

  it("allows self-attestation override in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGE_VERIFICATION_PROVIDER", "veriff");
    vi.stubEnv("AGE_VERIFICATION_API_KEY", "key");
    vi.stubEnv("AGE_VERIFICATION_ALLOW_SELF_ATTESTATION", "true");
    expect(isSelfAttestationAllowed()).toBe(true);
  });

  it("requires sign-in for strict vendor verification", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGE_VERIFICATION_PROVIDER", "veriff");
    vi.stubEnv("AGE_VERIFICATION_API_KEY", "key");
    expect(requiresSignedInAgeVerification()).toBe(true);
  });

  it("recognizes vendor-verified methods", () => {
    expect(isUserVendorAgeVerified("veriff:abc123")).toBe(true);
    expect(isUserVendorAgeVerified("dob-self-attestation")).toBe(false);
  });
});
