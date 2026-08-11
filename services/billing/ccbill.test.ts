import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCcbillEvent, verifyCcbillWebhook } from "@/services/billing/ccbill";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("ccbill webhooks", () => {
  it("verifies webhook signatures", () => {
    vi.stubEnv("CCBILL_WEBHOOK_SECRET", "test-secret");
    const payload = "eventType=NewSaleSuccess&customerId=user-1";
    const signature = crypto.createHmac("sha256", "test-secret").update(payload).digest("hex");
    expect(verifyCcbillWebhook(payload, signature)).toBe(true);
    expect(verifyCcbillWebhook(payload, "bad-signature")).toBe(false);
  });

  it("parses subscription events", () => {
    const event = parseCcbillEvent({
      eventType: "NewSaleSuccess",
      customerId: "user-123",
      subscriptionId: "sub-456",
      initialPeriod: "365",
    });

    expect(event.userId).toBe("user-123");
    expect(event.subscriptionId).toBe("sub-456");
    expect(event.planSlug).toBe("premium-yearly");
  });
});
