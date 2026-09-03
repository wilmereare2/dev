import { describe, expect, it } from "vitest";
import { resolveSiteLayoutMode } from "@/lib/site/layout-mode";

describe("layout-mode", () => {
  it("uses full-width chat layout for messages", () => {
    expect(resolveSiteLayoutMode("/messages")).toEqual({
      wide: true,
      flush: true,
      hideFooter: true,
      fillViewport: true,
    });
  });

  it("uses full-width gallery layout for discovery pages", () => {
    expect(resolveSiteLayoutMode("/promotions")).toEqual({
      fullWidth: true,
      flush: true,
    });
    expect(resolveSiteLayoutMode("/explore")).toEqual({
      fullWidth: true,
      flush: true,
    });
  });

  it("uses default layout for other routes", () => {
    expect(resolveSiteLayoutMode("/")).toEqual({});
    expect(resolveSiteLayoutMode("/settings/profile")).toEqual({});
  });
});
