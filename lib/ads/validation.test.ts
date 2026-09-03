import { describe, expect, it } from "vitest";
import {
  computeEffectiveAdStatus,
  formatCtr,
  isAdEligibleForServe,
  sanitizeAdText,
  validateDestinationUrl,
} from "@/lib/ads/validation";

describe("ads validation", () => {
  it("sanitizes ad text", () => {
    expect(sanitizeAdText("  Hello\x00World  ", 20)).toBe("HelloWorld");
  });

  it("rejects javascript URLs", () => {
    expect(validateDestinationUrl("javascript:alert(1)").ok).toBe(false);
  });

  it("accepts https URLs", () => {
    const result = validateDestinationUrl("https://example.com/path");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBe("https://example.com/path");
  });

  it("marks expired ads", () => {
    const status = computeEffectiveAdStatus({
      status: "active",
      endAt: new Date("2020-01-01"),
      now: new Date("2025-01-01"),
    });
    expect(status).toBe("expired");
  });

  it("checks serve eligibility", () => {
    expect(
      isAdEligibleForServe({
        status: "active",
        startAt: null,
        endAt: null,
      }),
    ).toBe(true);
    expect(
      isAdEligibleForServe({
        status: "paused",
        startAt: null,
        endAt: null,
      }),
    ).toBe(false);
  });

  it("formats CTR", () => {
    expect(formatCtr(100, 5)).toBe("5.00%");
    expect(formatCtr(0, 0)).toBe("0.00%");
  });
});
