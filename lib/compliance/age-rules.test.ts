import { describe, expect, it } from "vitest";
import {
  calculateAge,
  formatDateOfBirthInput,
  isAdult,
  parseDateOfBirth,
  parseDateOfBirthParts,
  parseDisplayDateOfBirth,
  toIsoDateString,
  validateAgeVerificationInput,
  validateAgeVerificationParts,
} from "@/lib/compliance/age-rules";

describe("age-rules", () => {
  const today = new Date("2026-08-10T12:00:00.000Z");

  it("calculates age before birthday", () => {
    expect(calculateAge(new Date(2000, 11, 25), today)).toBe(25);
  });

  it("parses ISO date input", () => {
    const result = parseDateOfBirth("1990-05-15");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(toIsoDateString(result.date)).toBe("1990-05-15");
    }
  });

  it("parses DD / MM / YYYY display input", () => {
    const result = parseDisplayDateOfBirth("15 / 05 / 1990");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.date.getFullYear()).toBe(1990);
      expect(result.date.getMonth()).toBe(4);
      expect(result.date.getDate()).toBe(15);
    }
  });

  it("rejects minors", () => {
    expect(isAdult(new Date(2010, 0, 1), today)).toBe(false);
  });

  it("accepts adults", () => {
    expect(isAdult(new Date(1990, 0, 1), today)).toBe(true);
  });

  it("requires policy acceptance", () => {
    const result = validateAgeVerificationInput({
      dateOfBirth: "01 / 01 / 1990",
      acceptTerms: false,
      acceptPrivacy: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Terms of Service");
    }
  });

  it("formats date input progressively", () => {
    expect(formatDateOfBirthInput("15051990")).toBe("15 / 05 / 1990");
  });

  it("parses separate day, month, and year fields", () => {
    const result = parseDateOfBirthParts("15", "5", "1990");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(toIsoDateString(result.date)).toBe("1990-05-15");
    }
  });

  it("validates policy acceptance from date parts", () => {
    const result = validateAgeVerificationParts({
      day: "01",
      month: "01",
      year: "2010",
      acceptTerms: true,
      acceptPrivacy: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("18");
    }
  });
});
