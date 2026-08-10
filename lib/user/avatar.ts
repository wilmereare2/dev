export const MAX_AVATAR_BYTES = 1024 * 1024;

export const AVATAR_SCALE_MIN = 75;
export const AVATAR_SCALE_MAX = 150;
export const AVATAR_SCALE_DEFAULT = 100;

export const AVATAR_FOCUS_MIN = -50;
export const AVATAR_FOCUS_MAX = 50;
export const AVATAR_FOCUS_DEFAULT = 0;

export function clampAvatarScale(value: number) {
  return Math.min(AVATAR_SCALE_MAX, Math.max(AVATAR_SCALE_MIN, Math.round(value)));
}

export function clampAvatarFocus(value: number) {
  return Math.min(AVATAR_FOCUS_MAX, Math.max(AVATAR_FOCUS_MIN, Math.round(value)));
}

export type AvatarFraming = {
  scale: number;
  focusX: number;
  focusY: number;
};

export function normalizeAvatarFraming(input?: Partial<AvatarFraming>): AvatarFraming {
  return {
    scale: clampAvatarScale(input?.scale ?? AVATAR_SCALE_DEFAULT),
    focusX: clampAvatarFocus(input?.focusX ?? AVATAR_FOCUS_DEFAULT),
    focusY: clampAvatarFocus(input?.focusY ?? AVATAR_FOCUS_DEFAULT),
  };
}

export const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateAvatarUpload(file: File) {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { ok: false as const, error: "Use a JPG, PNG, WebP, or GIF image." };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false as const, error: "Image must be 1 MB or smaller." };
  }

  return { ok: true as const };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

export function avatarSessionUrl(version: number) {
  return `/api/user/avatar/me?v=${version}`;
}

export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
