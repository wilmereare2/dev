import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findPurchase: vi.fn(),
  findFollow: vi.fn(),
  findCreatorSub: vi.fn(),
  platformSub: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    contentPurchase: { findFirst: mocks.findPurchase },
    creatorFollow: { findUnique: mocks.findFollow },
    creatorSubscription: { findFirst: mocks.findCreatorSub },
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
    const result = await resolveMemberPostAccess(undefined, {
      ...upload,
      ppvPriceCents: 500,
    });
    expect(result).toEqual({ canAccess: false, reason: "ppv" });
  });
});
