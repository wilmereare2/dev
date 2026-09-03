import { AD_PLACEMENT_KEYS, AD_STATUSES, isAdPlacement, type AdStatus } from "@/lib/ads/placements";

const BLOCKED_URL_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

export function sanitizeAdText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function validateDestinationUrl(raw: string) {
  const url = raw.trim();
  if (!url) return { ok: false as const, error: "Destination URL is required." };
  if (BLOCKED_URL_PROTOCOLS.test(url)) {
    return { ok: false as const, error: "URL protocol is not allowed." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false as const, error: "Enter a valid URL (include https://)." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false as const, error: "Only http and https URLs are allowed." };
  }

  return { ok: true as const, url: parsed.toString() };
}

export function validateImageUrl(raw?: string | null) {
  if (!raw?.trim()) return { ok: true as const, url: null as string | null };
  const url = raw.trim();
  if (url.startsWith("data:image/")) {
    if (url.length > 2_800_000) {
      return { ok: false as const, error: "Uploaded image is too large." };
    }
    return { ok: true as const, url };
  }
  return validateDestinationUrl(url);
}

export function parseAdStatus(value: string): AdStatus | null {
  return AD_STATUSES.includes(value as AdStatus) ? (value as AdStatus) : null;
}

export function parseAdPlacement(value: string) {
  return isAdPlacement(value) ? value : null;
}

export function computeEffectiveAdStatus(input: {
  status: string;
  startAt?: Date | null;
  endAt?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (input.status === "archived") return "archived" as const;
  if (input.status === "draft") return "draft" as const;
  if (input.status === "paused") return "paused" as const;
  if (input.endAt && input.endAt < now) return "expired" as const;
  if (input.startAt && input.startAt > now) return "scheduled" as const;
  if (input.status === "active") return "active" as const;
  return input.status;
}

export function isAdEligibleForServe(input: {
  status: string;
  startAt?: Date | null;
  endAt?: Date | null;
  archivedAt?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (input.archivedAt) return false;
  if (input.status !== "active") return false;
  if (input.startAt && input.startAt > now) return false;
  if (input.endAt && input.endAt < now) return false;
  return true;
}

export function computeCtr(impressions: number, clicks: number) {
  if (impressions <= 0) return 0;
  return clicks / impressions;
}

export function formatCtr(impressions: number, clicks: number) {
  const ctr = computeCtr(impressions, clicks);
  return `${(ctr * 100).toFixed(2)}%`;
}

export { AD_PLACEMENT_KEYS, AD_STATUSES };
