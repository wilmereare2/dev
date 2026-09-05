import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findPurchase: vi.fn(),
  findFollow: vi.fn(),
  findCreatorSub: vi.fn(),
  platformSub: vi.fn(),
  findUser: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    contentPurchase: { findFirst: mocks.findPurchase },
    creatorFollow: { findUnique: mocks.findFollow },
    creatorSubscription: { findFirst: mocks.findCreatorSub },
    user: { findUnique: mocks.findUser },
  },
}));

vi.mock("@/lib/auth/entitlements", () => ({
  userHasActiveSubscription: mocks.platformSub,
}));

import { canAccessCreatorContent, resolveMemberPostAccess } from "@/services/creator/monetization";

const upload = {
  id: "upload-1",
  creatorUserId: "creator-1",
  visibility: "public",
  isPremium: false,
  ppvPriceCents: null as number | null,
};

describe("content access", () => {
  beforeEach(() => {
    mocks.findPurchase.mockResolvedValue(null);
    mocks.findFollow.mockResolvedValue(null);
    mocks.findCreatorSub.mockResolvedValue(null);
    mocks.platformSub.mockResolvedValue(false);
    // Verified by default; individual tests opt into the unverified case.
    mocks.findUser.mockResolvedValue({ emailVerified: new Date() });
  });

  it("allows anonymous access to free public content", async () => {
    expect(await canAccessCreatorContent(undefined, upload)).toBe(true);
  });

  it("blocks anonymous access to premium content", async () => {
    expect(
      await canAccessCreatorContent(undefined, {
        ...upload,
        isPremium: true,
      }),
    ).toBe(false);
  });

  it("blocks anonymous access to PPV content", async () => {
    expect(
      await canAccessCreatorContent(undefined, {
        ...upload,
        ppvPriceCents: 999,
      }),
    ).toBe(false);
  });

  it("allows creator access to their own private content", async () => {
    expect(
      await canAccessCreatorContent("creator-1", {
        ...upload,
        visibility: "private",
      }),
    ).toBe(true);
  });

  it("requires purchase for PPV content", async () => {
    mocks.findPurchase.mockResolvedValue(null);
    expect(
      await canAccessCreatorContent("viewer-1", {
        ...upload,
        ppvPriceCents: 999,
      }),
    ).toBe(false);

    mocks.findPurchase.mockResolvedValue({ id: "purchase-1" });
    expect(
      await canAccessCreatorContent("viewer-1", {
        ...upload,
        ppvPriceCents: 999,
      }),
    ).toBe(true);
  });

  it("requires platform or creator subscription for premium content", async () => {
    mocks.platformSub.mockResolvedValue(false);
    mocks.findCreatorSub.mockResolvedValue(null);
    expect(
      await canAccessCreatorContent("viewer-1", {
        ...upload,
        isPremium: true,
      }),
    ).toBe(false);

    mocks.platformSub.mockResolvedValue(true);
    expect(
      await canAccessCreatorContent("viewer-1", {
        ...upload,
        isPremium: true,
      }),
    ).toBe(true);
  });

  it("returns denial reasons for locked posts", async () => {
    // Member posts now require a signed-in, verified viewer, so a signed-out
    // visitor is asked to sign in before any paywall reason is revealed.
    const result = await resolveMemberPostAccess("viewer-1", {
      ...upload,
      ppvPriceCents: 500,
    });
    expect(result).toEqual({ canAccess: false, reason: "ppv" });
  });
});

describe("email verification gate on member posts", () => {
  beforeEach(() => {
    mocks.findPurchase.mockResolvedValue(null);
    mocks.findFollow.mockResolvedValue(null);
    mocks.findCreatorSub.mockResolvedValue(null);
    mocks.platformSub.mockResolvedValue(false);
  });

  it("blocks an unverified member from another member's post", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: null });

    const result = await resolveMemberPostAccess("viewer-1", upload);
    expect(result).toEqual({ canAccess: false, reason: "email_verification" });
  });

  it("allows a verified member through to the normal checks", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: new Date() });

    const result = await resolveMemberPostAccess("viewer-1", upload);
    expect(result).toEqual({ canAccess: true });
  });

  it("never blocks the creator from their own post", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: null });

    const result = await resolveMemberPostAccess("creator-1", upload);
    expect(result).toEqual({ canAccess: true });
  });

  it("still reports the paywall reason for a verified member", async () => {
    mocks.findUser.mockResolvedValue({ emailVerified: new Date() });

    const result = await resolveMemberPostAccess("viewer-1", {
      ...upload,
      ppvPriceCents: 500,
    });
    expect(result).toEqual({ canAccess: false, reason: "ppv" });
  });

  it("asks a signed-out visitor to sign in rather than to verify", async () => {
    const result = await resolveMemberPostAccess(undefined, upload);
    expect(result).toEqual({ canAccess: false, reason: "sign_in" });
  });
});
