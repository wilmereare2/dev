import { describe, expect, it } from "vitest";
import { stripMemberPostMedia } from "@/services/creator/uploads";

describe("member post media stripping", () => {
  it("removes mediaUrl from listing previews", () => {
    const post = {
      id: "post-1",
      title: "Locked post",
      description: null,
      mediaType: "video",
      thumbnailUrl: "https://cdn.example/thumb.jpg",
      mediaUrl: "https://cdn.example/full.mp4",
      visibility: "public",
      isPremium: true,
      ppvPriceCents: 999,
      categories: [],
      tags: [],
      publishedAt: "2026-01-01T00:00:00.000Z",
      creator: {
        id: "creator-1",
        name: "Creator",
        image: null,
        slug: "creator",
      },
    };

    const stripped = stripMemberPostMedia(post);
    expect(stripped.mediaUrl).toBeNull();
    expect(stripped.thumbnailUrl).toBe(post.thumbnailUrl);
    expect(stripped.title).toBe(post.title);
  });
});
