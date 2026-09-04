/**
 * Pure helpers for the internal ad-creative reference path. Kept free of
 * database imports so validation and client code can use them safely.
 */

/** Public path prefix for creatives persisted in the database. */
export const AD_CREATIVE_PATH_PREFIX = "/api/ads/creative/";

export function adCreativePath(id: string) {
  return `${AD_CREATIVE_PATH_PREFIX}${id}`;
}

/** Extracts the creative id from a reference path, ignoring any leading origin. */
export function parseAdCreativeId(value: string) {
  const trimmed = value.trim();
  let path = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      path = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  if (!path.startsWith(AD_CREATIVE_PATH_PREFIX)) return null;
  const id = path.slice(AD_CREATIVE_PATH_PREFIX.length).split(/[?#/]/)[0];
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null;
}

export function isAdCreativePath(value: string) {
  return parseAdCreativeId(value) !== null;
}
