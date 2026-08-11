const FALLBACK_APP_URL = "http://localhost:3000";

/** Avoid crashing metadata/layout when NEXT_PUBLIC_APP_URL is missing or malformed. */
export function resolveAppBaseUrl(raw = process.env.NEXT_PUBLIC_APP_URL) {
  const value = raw?.trim();
  if (!value) return FALLBACK_APP_URL;

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).origin;
  } catch {
    return FALLBACK_APP_URL;
  }
}

export function resolveMetadataBaseUrl() {
  return new URL(resolveAppBaseUrl());
}
