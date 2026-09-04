import { describe, expect, it } from "vitest";
import {
  isNetworkCreative,
  parseAdCreativeType,
  validateEmbedCode,
  validateIframeUrl,
} from "@/lib/ads/network";
import { validateAdvertisementInput } from "@/services/admin/advertisements";

describe("ad creative types", () => {
  it("defaults unknown values to direct", () => {
    expect(parseAdCreativeType(undefined)).toBe("direct");
    expect(parseAdCreativeType("nonsense")).toBe("direct");
    expect(parseAdCreativeType("script")).toBe("script");
  });

  it("classifies network creatives", () => {
    expect(isNetworkCreative("script")).toBe(true);
    expect(isNetworkCreative("iframe")).toBe(true);
    expect(isNetworkCreative("direct")).toBe(false);
  });
});

describe("validateEmbedCode", () => {
  it("accepts a network script tag", () => {
    const result = validateEmbedCode('<script async src="https://a.exoclick.com/tag.js"></script>');
    expect(result.ok).toBe(true);
  });

  it("rejects empty and non-tag input", () => {
    expect(validateEmbedCode("").ok).toBe(false);
    expect(validateEmbedCode("   ").ok).toBe(false);
    expect(validateEmbedCode("just some text").ok).toBe(false);
  });

  it("rejects an oversized tag", () => {
    expect(validateEmbedCode(`<script>${"a".repeat(20_001)}</script>`).ok).toBe(false);
  });
});

describe("validateIframeUrl", () => {
  it("requires https", () => {
    expect(validateIframeUrl("http://syndication.example.com/x").ok).toBe(false);
    expect(validateIframeUrl("https://syndication.example.com/x").ok).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(validateIframeUrl("not a url").ok).toBe(false);
    expect(validateIframeUrl("").ok).toBe(false);
  });
});

describe("validateAdvertisementInput for network ads", () => {
  const base = {
    title: "ExoClick sidebar",
    advertiserName: "ExoClick",
    placement: "sidebar_1",
  };

  it("accepts a script ad with no banner and no destination URL", () => {
    const result = validateAdvertisementInput({
      ...base,
      destinationUrl: "",
      creativeType: "script",
      networkName: "ExoClick",
      embedCode: '<script src="https://a.exoclick.com/tag.js"></script>',
      status: "active",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.creativeType).toBe("script");
      expect(result.data.networkName).toBe("ExoClick");
      expect(result.data.imageUrl).toBeNull();
    }
  });

  it("requires a network name", () => {
    const result = validateAdvertisementInput({
      ...base,
      destinationUrl: "",
      creativeType: "script",
      networkName: "",
      embedCode: '<script src="https://a.exoclick.com/tag.js"></script>',
    });
    expect(result.ok).toBe(false);
  });

  it("requires the tag itself", () => {
    const result = validateAdvertisementInput({
      ...base,
      destinationUrl: "",
      creativeType: "script",
      networkName: "ExoClick",
      embedCode: "",
    });
    expect(result.ok).toBe(false);
  });

  it("still requires a banner for an active direct ad", () => {
    const result = validateAdvertisementInput({
      ...base,
      destinationUrl: "https://example.com",
      creativeType: "direct",
      status: "active",
      imageUrl: null,
    });
    expect(result.ok).toBe(false);
  });

  it("still requires a destination URL for a direct ad", () => {
    const result = validateAdvertisementInput({
      ...base,
      destinationUrl: "",
      creativeType: "direct",
    });
    expect(result.ok).toBe(false);
  });
});
