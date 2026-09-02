export type ResolvedVideo =
  | { kind: "direct"; url: string }
  | { kind: "embed"; embedUrl: string; provider: "youtube" | "vimeo" };

const PEXELS_HOST = "pexels.com";
const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|m3u8)(\?|$)/i;

export function extractPexelsVideoId(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!host.endsWith(PEXELS_HOST)) return null;
    const match = new URL(url).pathname.match(/\/video\/(?:.*-)?(\d+)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      return parsed.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

export function extractVimeoVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? id : null;
    }
    if (host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoIndex = parts.indexOf("video");
      const id = videoIndex >= 0 ? parts[videoIndex + 1] : null;
      return id && /^\d+$/.test(id) ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isDirectVideoUrl(url: string): boolean {
  if (DIRECT_VIDEO_PATTERN.test(url)) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "videos.pexels.com" || host.endsWith(".blob.core.windows.net");
  } catch {
    return false;
  }
}

async function resolvePexelsPageUrl(url: string): Promise<string | null> {
  const id = extractPexelsVideoId(url);
  if (!id) return null;

  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (apiKey) {
    try {
      const response = await fetch(`https://api.pexels.com/v1/videos/${id}`, {
        headers: { Authorization: apiKey },
        next: { revalidate: 3600 },
      });
      if (response.ok) {
        const data = (await response.json()) as {
          video_files?: Array<{ link?: string; quality?: string; width?: number | null }>;
        };
        const files = data.video_files?.filter((file) => file.link) ?? [];
        const hd = files
          .filter((file) => file.quality === "hd")
          .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
        const best =
          hd ??
          files.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
        if (best?.link) return best.link;
      }
    } catch {
      // Fall through to download redirect.
    }
  }

  try {
    const downloadUrl = `https://www.pexels.com/download/video/${id}/`;
    const response = await fetch(downloadUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Manuelax/1.0)",
        Referer: `https://www.pexels.com/video/${id}/`,
      },
      next: { revalidate: 3600 },
    });
    if (response.ok && response.url && isDirectVideoUrl(response.url)) {
      return response.url;
    }
  } catch {
    return null;
  }

  return null;
}

/** Turn a Studio URL into something the player can use (direct file or embed). */
export async function resolveVideoUrl(rawUrl: string): Promise<ResolvedVideo | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  if (isDirectVideoUrl(url)) {
    return { kind: "direct", url };
  }

  const youtubeId = extractYouTubeVideoId(url);
  if (youtubeId) {
    return {
      kind: "embed",
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0`,
    };
  }

  const vimeoId = extractVimeoVideoId(url);
  if (vimeoId) {
    return {
      kind: "embed",
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (extractPexelsVideoId(url)) {
    const directUrl = await resolvePexelsPageUrl(url);
    if (directUrl) return { kind: "direct", url: directUrl };
  }

  // Unknown page URL — still try as direct (some CDNs omit extensions).
  return { kind: "direct", url };
}
