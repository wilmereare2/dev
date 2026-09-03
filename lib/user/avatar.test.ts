import { describe, expect, it } from "vitest";
import { MAX_AVATAR_DATA_URL_CHARS, prepareAvatarDataUrl } from "@/lib/user/avatar";

describe("prepareAvatarDataUrl", () => {
  it("accepts reasonably sized buffers", () => {
    const buffer = Buffer.alloc(8_000, 1);
    const result = prepareAvatarDataUrl(buffer, "image/jpeg");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
    }
  });

  it("rejects oversized data urls", () => {
    const buffer = Buffer.alloc(MAX_AVATAR_DATA_URL_CHARS, 1);
    const result = prepareAvatarDataUrl(buffer, "image/jpeg");
    expect(result.ok).toBe(false);
  });
});
