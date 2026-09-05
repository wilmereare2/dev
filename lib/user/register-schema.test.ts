import { describe, expect, it } from "vitest";
import { registerProfileSchema } from "@/lib/user/register-schema";

const minimal = {
  username: "jamesmartin",
  email: "james@example.com",
  password: "supersecret",
};

describe("sign-up schema", () => {
  it("accepts username, email and password alone", () => {
    const result = registerProfileSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("jamesmartin");
      // Profile details are simply absent rather than empty strings.
      expect(result.data.name).toBeUndefined();
      expect(result.data.dateOfBirth).toBeUndefined();
      expect(result.data.gender).toBeUndefined();
      expect(result.data.country).toBeUndefined();
      expect(result.data.race).toBeUndefined();
      expect(result.data.hobbies).toBeUndefined();
    }
  });

  it("treats blank profile fields as not provided", () => {
    const result = registerProfileSchema.safeParse({
      ...minimal,
      name: "",
      dateOfBirth: "",
      gender: "",
      country: "",
      race: "",
      hobbies: "",
      phone: "",
      telegram: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
      expect(result.data.phone).toBe("");
    }
  });

  it("still requires a username", () => {
    expect(registerProfileSchema.safeParse({ ...minimal, username: "" }).success).toBe(false);
    expect(registerProfileSchema.safeParse({ ...minimal, username: "ab" }).success).toBe(false);
    expect(registerProfileSchema.safeParse({ ...minimal, username: "has space" }).success).toBe(
      false,
    );
  });

  it("still requires a valid email and an 8-character password", () => {
    expect(registerProfileSchema.safeParse({ ...minimal, email: "nope" }).success).toBe(false);
    expect(registerProfileSchema.safeParse({ ...minimal, password: "short" }).success).toBe(false);
  });

  it("validates optional fields when they are supplied", () => {
    expect(
      registerProfileSchema.safeParse({ ...minimal, dateOfBirth: "not-a-date" }).success,
    ).toBe(false);
    expect(registerProfileSchema.safeParse({ ...minimal, gender: "Nonsense" }).success).toBe(false);
    expect(registerProfileSchema.safeParse({ ...minimal, phone: "123" }).success).toBe(false);
  });

  it("keeps a supplied name and date of birth", () => {
    const result = registerProfileSchema.safeParse({
      ...minimal,
      name: "  James Martin  ",
      dateOfBirth: "1990-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("James Martin");
      expect(result.data.dateOfBirth).toBe("1990-01-01");
    }
  });
});
