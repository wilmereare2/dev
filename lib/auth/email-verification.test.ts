import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUser: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUser } },
}));

import { hasVerifiedEmail, requireVerifiedEmail } from "@/lib/auth/email-verification";

describe("email verification gate", () => {
  beforeEach(() => {
    mocks.findUser.mockReset();
  });

  it("reports an unknown or signed-out user as unverified", async () => {
    expect(await hasVerifiedEmail(undefined)).toBe(false);
    expect(await hasVerifiedEmail(null)).toBe(false);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("reads the verification timestamp", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: new Date() });
    expect(await hasVerifiedEmail("user-1")).toBe(true);

    mocks.findUser.mockResolvedValue({ emailVerified: null });
    expect(await hasVerifiedEmail("user-1")).toBe(false);
  });

  it("asks a signed-out visitor to sign in", async () => {
    const result = await requireVerifiedEmail(null, "notifications");
    expect(result).toEqual({
      allowed: false,
      reason: "sign_in",
      message: "Sign in to continue.",
    });
  });

  it("asks an unverified member to verify, per feature", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: null });

    const notifications = await requireVerifiedEmail("user-1", "notifications");
    expect(notifications).toMatchObject({ allowed: false, reason: "email_verification" });
    expect(notifications.allowed === false && notifications.message).toContain("notifications");

    const posts = await requireVerifiedEmail("user-1", "memberPosts");
    expect(posts.allowed === false && posts.message).toContain("promoted by other members");
  });

  it("allows a verified member", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: new Date() });
    expect(await requireVerifiedEmail("user-1", "notifications")).toEqual({ allowed: true });
  });
});
