import { afterEach, describe, expect, it, vi } from "vitest";
import { isCcbillCreatorCheckoutConfigured } from "@/services/billing/creator-checkout";
import {
  CREATOR_MONETIZATION_UNAVAILABLE,
  isCreatorMonetizationEnabled,
} from "@/services/billing/creator-monetization";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("creator-monetization policy", () => {
  it("is enabled in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isCreatorMonetizationEnabled()).toBe(true);
  });

  it("is disabled in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.BILLING_DEV_MODE;
    expect(isCreatorMonetizationEnabled()).toBe(false);
  });

  it("can be enabled for staging via BILLING_DEV_MODE", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BILLING_DEV_MODE", "true");
    expect(isCreatorMonetizationEnabled()).toBe(true);
  });

  it("can be enabled in production when CCBill creator forms are configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.BILLING_DEV_MODE;
    vi.stubEnv("CCBILL_ACCOUNT", "900000");
    vi.stubEnv("CCBILL_SUBACCOUNT", "0000");
    vi.stubEnv("CCBILL_SALT", "salt");
    vi.stubEnv("CCBILL_FLEXFORM_ID", "platform-form");
    vi.stubEnv("CCBILL_CREATOR_ONETIME_FLEXFORM_ID", "ppv-form");
    vi.stubEnv("CCBILL_CREATOR_SUB_FLEXFORM_ID", "sub-form");
    expect(isCcbillCreatorCheckoutConfigured()).toBe(true);
    expect(isCreatorMonetizationEnabled()).toBe(true);
  });

  it("exposes a stable unavailable message", () => {
    expect(CREATOR_MONETIZATION_UNAVAILABLE).toContain("CCBill");
  });
});
