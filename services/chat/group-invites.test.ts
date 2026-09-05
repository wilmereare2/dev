import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUsers: vi.fn(),
  findConversations: vi.fn(),
  findFollows: vi.fn(),
  findChannel: vi.fn(),
  findChatMessages: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findMany: mocks.findUsers },
    directConversation: { findMany: mocks.findConversations },
    creatorFollow: { findMany: mocks.findFollows },
    chatChannel: { findUnique: mocks.findChannel },
    chatMessage: { findMany: mocks.findChatMessages },
  },
}));

vi.mock("@/services/user/notifications", () => ({ createUserNotification: vi.fn() }));

import { searchMembers } from "@/services/chat/direct-messages";

const USERS = [
  { id: "verified-1", username: "jamesmartin", name: "James Martin", image: null, role: "USER" },
];

describe("member search", () => {
  beforeEach(() => {
    mocks.findUsers.mockReset().mockResolvedValue(USERS);
    mocks.findConversations.mockReset().mockResolvedValue([]);
    mocks.findFollows.mockReset().mockResolvedValue([]);
    mocks.findChannel.mockReset().mockResolvedValue(null);
    mocks.findChatMessages.mockReset().mockResolvedValue([]);
  });

  it("searches by username and name, never by email", async () => {
    await searchMembers("me", "james");

    const where = mocks.findUsers.mock.calls[0][0].where;
    const searchedFields = where.OR.map((clause: Record<string, unknown>) => Object.keys(clause)[0]);
    expect(searchedFields.sort()).toEqual(["name", "username"]);
    expect(JSON.stringify(where)).not.toContain("email");
  });

  it("does not filter by verification for direct messaging", async () => {
    await searchMembers("me", "james");
    expect(mocks.findUsers.mock.calls[0][0].where.emailVerified).toBeUndefined();
  });

  it("restricts group-invite search to verified members", async () => {
    await searchMembers("me", "james", 30, { verifiedOnly: true });
    expect(mocks.findUsers.mock.calls[0][0].where.emailVerified).toEqual({ not: null });
  });

  it("excludes the searcher from their own results", async () => {
    await searchMembers("me", "james");
    expect(mocks.findUsers.mock.calls[0][0].where.id).toEqual({ not: "me" });
  });

  it("returns no email field in the payload", async () => {
    const results = await searchMembers("me", "james");
    expect(results[0]).not.toHaveProperty("email");
    expect(Object.keys(results[0]).sort()).toEqual(
      ["displayName", "id", "image", "known", "name", "role", "username"].sort(),
    );
  });
});
