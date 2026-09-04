import { describe, expect, it } from "vitest";
import { adCreativePath, isAdCreativePath, parseAdCreativeId } from "@/lib/ads/creative-path";
import { validateImageUrl } from "@/lib/ads/validation";

describe("ad creative paths", () => {
  it("builds and parses a creative path", () => {
    const path = adCreativePath("abc123");
    expect(path).toBe("/api/ads/creative/abc123");
    expect(parseAdCreativeId(path)).toBe("abc123");
  });

  it("parses an absolute URL pointing at a creative", () => {
    expect(parseAdCreativeId("https://manuelax.com/api/ads/creative/xyz789")).toBe("xyz789");
  });

  it("ignores query strings and trailing segments", () => {
    expect(parseAdCreativeId("/api/ads/creative/abc123?v=2")).toBe("abc123");
    expect(parseAdCreativeId("/api/ads/creative/abc123/extra")).toBe("abc123");
  });

  it("rejects unrelated and traversal paths", () => {
    expect(parseAdCreativeId("/api/ads/serve")).toBeNull();
    expect(parseAdCreativeId("https://evil.com/x.png")).toBeNull();
    expect(parseAdCreativeId("/api/ads/creative/..%2f..%2fetc")).toBeNull();
    expect(parseAdCreativeId("/api/ads/creative/")).toBeNull();
    expect(isAdCreativePath("data:image/png;base64,AAAA")).toBe(false);
  });
});

describe("validateImageUrl", () => {
  it("accepts a stored creative reference and normalizes it", () => {
    const result = validateImageUrl("https://manuelax.com/api/ads/creative/abc123");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBe("/api/ads/creative/abc123");
  });

  it("treats an empty value as no image", () => {
    const result = validateImageUrl("  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBeNull();
  });

  it("still accepts small legacy data URLs", () => {
    const result = validateImageUrl("data:image/png;base64,AAAA");
    expect(result.ok).toBe(true);
  });

  it("rejects oversized legacy data URLs", () => {
    const huge = `data:image/png;base64,${"A".repeat(2_800_001)}`;
    expect(validateImageUrl(huge).ok).toBe(false);
  });

  it("rejects a javascript URL as an image source", () => {
    expect(validateImageUrl("javascript:alert(1)").ok).toBe(false);
  });
});

describe("validateAdvertisementInput with stored creatives", () => {
  const base = {
    title: "Best Advertisement",
    advertiserName: "Freelancer",
    destinationUrl: "https://www.freelancer.com/u/wilmerae",
    placement: "homepage_top",
  };

  it("accepts a full payload that references stored creatives", async () => {
    const { validateAdvertisementInput } = await import("@/services/admin/advertisements");
    const result = validateAdvertisementInput({
      ...base,
      status: "active",
      priority: 1,
      startAt: "2026-09-04T09:19:00.000Z",
      endAt: "2026-10-24T09:19:00.000Z",
      altText: "Let's see my profile",
      imageUrl: "/api/ads/creative/aaa111",
      imageUrlTablet: "/api/ads/creative/bbb222",
      imageUrlMobile: "/api/ads/creative/ccc333",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.imageUrl).toBe("/api/ads/creative/aaa111");
      expect(result.data.imageUrlTablet).toBe("/api/ads/creative/bbb222");
      expect(result.data.imageUrlMobile).toBe("/api/ads/creative/ccc333");
      expect(result.data.status).toBe("active");
    }
  });

  it("still requires a banner before an ad can go active", async () => {
    const { validateAdvertisementInput } = await import("@/services/admin/advertisements");
    const result = validateAdvertisementInput({ ...base, status: "active", imageUrl: null });
    expect(result.ok).toBe(false);
  });

  it("rejects an end date before the start date", async () => {
    const { validateAdvertisementInput } = await import("@/services/admin/advertisements");
    const result = validateAdvertisementInput({
      ...base,
      startAt: "2026-10-24T09:19:00.000Z",
      endAt: "2026-09-04T09:19:00.000Z",
      imageUrl: "/api/ads/creative/aaa111",
    });
    expect(result.ok).toBe(false);
  });
});
