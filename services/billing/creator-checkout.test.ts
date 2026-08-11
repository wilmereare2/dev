import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCcbillDynamicCheckoutUrl,
  resolveCreatorFlexformId,
} from "@/services/billing/ccbill-creator-forms";
import {
  parseCreatorCheckoutIntent,
  serializeCreatorCheckoutIntent,
} from "@/services/billing/creator-checkout";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("creator checkout", () => {
  it("serializes and parses checkout intents", () => {
    const intent = {
      type: "ppv" as const,
      uploadId: "upload-1",
      amountCents: 999,
      title: "Premium clip",
    };

    const parsed = parseCreatorCheckoutIntent(serializeCreatorCheckoutIntent(intent));
    expect(parsed).toEqual(intent);
  });

  it("builds dynamic CCBill checkout URLs with checkout reference", () => {
    vi.stubEnv("CCBILL_ACCOUNT", "900000");
    vi.stubEnv("CCBILL_SUBACCOUNT", "0000");
    vi.stubEnv("CCBILL_SALT", "salty");
    vi.stubEnv("CCBILL_CREATOR_ONETIME_FLEXFORM_ID", "ppv-form");

    const url = buildCcbillDynamicCheckoutUrl({
      userId: "user-1",
      email: "fan@example.com",
      amountCents: 999,
      returnUrl: "https://example.com/posts/upload-1?billing=success",
      flexformId: resolveCreatorFlexformId("onetime")!,
      checkoutRef: "checkout-123",
      recurring: false,
    });

    expect(url).toContain("bill.ccbill.com");
    expect(url).toContain("X-checkoutRef=checkout-123");
    expect(url).toContain("initialPrice=9.99");
  });

  it("uses distinct digest inputs for recurring creator subscriptions", () => {
    vi.stubEnv("CCBILL_ACCOUNT", "900000");
    vi.stubEnv("CCBILL_SUBACCOUNT", "0000");
    vi.stubEnv("CCBILL_SALT", "salty");
    vi.stubEnv("CCBILL_CREATOR_SUB_FLEXFORM_ID", "sub-form");

    const oneTime = buildCcbillDynamicCheckoutUrl({
      userId: "user-1",
      email: "fan@example.com",
      amountCents: 500,
      returnUrl: "https://example.com/promotions?billing=success",
      flexformId: "onetime-form",
      checkoutRef: "checkout-a",
      recurring: false,
    });

    const recurring = buildCcbillDynamicCheckoutUrl({
      userId: "user-1",
      email: "fan@example.com",
      amountCents: 500,
      returnUrl: "https://example.com/promotions?billing=success",
      flexformId: "sub-form",
      checkoutRef: "checkout-b",
      recurring: true,
    });

    expect(oneTime).not.toEqual(recurring);
    expect(recurring).toContain("numRebills=99");
  });
});

describe("ccbill checkout reference parsing", () => {
  it("includes checkoutRef in parsed events", async () => {
    const { parseCcbillEvent } = await import("@/services/billing/ccbill");
    const event = parseCcbillEvent({
      eventType: "NewSaleSuccess",
      customerId: "user-1",
      "X-checkoutRef": "pay_123",
    });
    expect(event.checkoutRef).toBe("pay_123");
  });
});
