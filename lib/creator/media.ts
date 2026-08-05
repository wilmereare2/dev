export const MAX_CREATOR_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CREATOR_VIDEO_BYTES = 100 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
export const ALLOWED_AUDIO_TYPES = new Set(["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4"]);

export function validateCreatorFile(file: File, kind: "image" | "video" | "audio") {
  const allowed =
    kind === "image" ? ALLOWED_IMAGE_TYPES : kind === "video" ? ALLOWED_VIDEO_TYPES : ALLOWED_AUDIO_TYPES;
  const max =
    kind === "image" ? MAX_CREATOR_IMAGE_BYTES : kind === "video" ? MAX_CREATOR_VIDEO_BYTES : 20 * 1024 * 1024;

  if (!allowed.has(file.type)) {
    return { ok: false as const, error: `Unsupported ${kind} type: ${file.type || "unknown"}.` };
  }
  if (file.size > max) {
    return { ok: false as const, error: `File must be ${Math.round(max / (1024 * 1024))} MB or smaller.` };
  }
  return { ok: true as const };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function parseTagsInput(input?: string | null) {
  if (!input?.trim()) return [];
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function serializeTags(tags: string[]) {
  return tags.length ? JSON.stringify(tags) : null;
}

export function deserializeTags(raw?: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}
