import { describe, expect, it } from "vitest";
import {
  isPhoneVerificationOffered,
  isPhoneVerificationRequired,
} from "@/lib/auth/phone-verification-policy";

describe("phone-verification-policy", () => {
  it("does not require phone verification by default", () => {
    expect(isPhoneVerificationRequired()).toBe(false);
  });

  it("does not offer phone verification unless configured", () => {
    expect(isPhoneVerificationOffered()).toBe(false);
  });
});
