import { describe, expect, it } from "vitest";
import { CHAT_USER_SELECT, PRIVATE_CONTACT_FIELDS, chatDisplayName } from "@/lib/user/public-select";

/**
 * 2-3: members must never be able to read another member's email (or other
 * private contact details), while still being findable by name.
 */
describe("chat member privacy", () => {
  it("never selects private contact fields for chat surfaces", () => {
    const selected = Object.keys(CHAT_USER_SELECT);
    for (const field of PRIVATE_CONTACT_FIELDS) {
      expect(selected).not.toContain(field);
    }
  });

  it("exposes only public identity fields", () => {
    expect(Object.keys(CHAT_USER_SELECT).sort()).toEqual(
      ["id", "image", "name", "role", "username"].sort(),
    );
  });

  it("identifies members by handle, falling back to name", () => {
    expect(chatDisplayName({ username: "jamesmartin", name: "James" })).toBe("@jamesmartin");
    expect(chatDisplayName({ username: null, name: "James Martin" })).toBe("James Martin");
    expect(chatDisplayName({ username: null, name: null })).toBe("Member");
  });
});
