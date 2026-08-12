import { describe, expect, it } from "vitest";
import {
  COUNTRY_OPTIONS,
  COUNTRY_SET,
  GENDER_OPTIONS,
  GENDER_SET,
  RACE_OPTIONS,
  RACE_SET,
} from "@/lib/user/profile-options";

describe("profile-options", () => {
  it("includes standard gender options", () => {
    expect(GENDER_OPTIONS).toContain("Woman");
    expect(GENDER_OPTIONS).toContain("Man");
    expect(GENDER_OPTIONS).toContain("Prefer not to say");
    expect(GENDER_SET.size).toBe(GENDER_OPTIONS.length);
  });

  it("includes standard race and ethnicity options", () => {
    expect(RACE_OPTIONS).toContain("Asian");
    expect(RACE_OPTIONS).toContain("White");
    expect(RACE_OPTIONS).toContain("Prefer not to say");
    expect(RACE_SET.size).toBe(RACE_OPTIONS.length);
  });

  it("builds a sorted ISO country list", () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(190);
    expect(COUNTRY_OPTIONS).toContain("United States");
    expect(COUNTRY_OPTIONS).toContain("Japan");
    expect(COUNTRY_SET.size).toBe(COUNTRY_OPTIONS.length);

    const sorted = [...COUNTRY_OPTIONS].sort((a, b) => a.localeCompare(b));
    expect(COUNTRY_OPTIONS).toEqual(sorted);
  });
});
