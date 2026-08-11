import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAgeVerifiedCookie, isAgeVerifiedCookie } from "@/lib/auth/age-cookie";

describe("age-cookie", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "unit-test-age-cookie-secret");
  });

  it("creates a verifiable signed cookie", async () => {
    const cookie = await createAgeVerifiedCookie(true);
    expect(await isAgeVerifiedCookie(cookie.value)).toBe(true);
  });

  it("rejects tampered cookies", async () => {
    const cookie = await createAgeVerifiedCookie(false);
    expect(await isAgeVerifiedCookie(`${cookie.value}x`)).toBe(false);
  });

  it("rejects missing cookies", async () => {
    expect(await isAgeVerifiedCookie(undefined)).toBe(false);
  });
});
