import { describe, expect, it } from "vitest";
import {
  extractPexelsVideoId,
  extractVimeoVideoId,
  extractYouTubeVideoId,
  isDirectVideoUrl,
} from "@/lib/streaming/video-url";

describe("video-url", () => {
  it("extracts Pexels video ids from page links", () => {
    expect(extractPexelsVideoId("https://www.pexels.com/video/journaling-19846726")).toBe("19846726");
    expect(extractPexelsVideoId("https://pexels.com/video/2499611/")).toBe("2499611");
    expect(extractPexelsVideoId("https://example.com/video/1")).toBeNull();
  });

  it("extracts YouTube ids", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts Vimeo ids", () => {
    expect(extractVimeoVideoId("https://vimeo.com/76979871")).toBe("76979871");
    expect(extractVimeoVideoId("https://player.vimeo.com/video/76979871")).toBe("76979871");
  });

  it("detects direct video urls", () => {
    expect(isDirectVideoUrl("https://cdn.example.com/clip.mp4")).toBe(true);
    expect(isDirectVideoUrl("https://videos.pexels.com/video-files/1/file.mp4")).toBe(true);
    expect(isDirectVideoUrl("https://www.pexels.com/video/journaling-19846726")).toBe(false);
  });
});
