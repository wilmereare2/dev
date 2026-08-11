import { describe, expect, it } from "vitest";
import { normalizePhoneNumber } from "@/lib/auth/verification-codes";

describe("verification codes", () => {
  it("normalizes phone numbers to digits", () => {
    expect(normalizePhoneNumber("+1 (555) 123-4567")).toBe("15551234567");
    expect(normalizePhoneNumber("123")).toBeNull();
  });
});
