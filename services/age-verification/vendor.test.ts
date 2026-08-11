import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseVeriffWebhook, verifyVeriffWebhook } from "@/services/age-verification/vendor";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe("veriff webhooks", () => {
  it("verifies webhook signatures", () => {
    vi.stubEnv("AGE_VERIFICATION_WEBHOOK_SECRET", "veriff-secret");
    const payload = JSON.stringify({ verification: { status: "approved", vendorData: "user-1", id: "ref-1" } });
    const signature = crypto.createHmac("sha256", "veriff-secret").update(payload).digest("hex");
    expect(verifyVeriffWebhook(payload, signature)).toBe(true);
    expect(verifyVeriffWebhook(payload, "invalid")).toBe(false);
  });

  it("parses approved verification payloads", () => {
    const parsed = parseVeriffWebhook({
      verification: {
        status: "approved",
        vendorData: "user-abc",
        id: "session-123",
      },
    });

    expect(parsed.status).toBe("approved");
    expect(parsed.userId).toBe("user-abc");
    expect(parsed.referenceId).toBe("session-123");
  });
});
