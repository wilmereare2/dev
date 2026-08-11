import { describe, expect, it } from "vitest";
import { displayHandle, isValidUsername, normalizeUsername } from "@/lib/user/username";

describe("username", () => {
  it("normalizes to lowercase", () => {
    expect(normalizeUsername("JamesMartin")).toBe("jamesmartin");
  });

  it("accepts alphanumeric usernames", () => {
    expect(isValidUsername("james123")).toBe(true);
  });

  it("rejects special characters", () => {
    expect(isValidUsername("james!")).toBe(false);
    expect(isValidUsername("user name")).toBe(false);
  });

  it("formats public handles", () => {
    expect(displayHandle("jamesmartin", "James")).toBe("@jamesmartin");
  });
});
