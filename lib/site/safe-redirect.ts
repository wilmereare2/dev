/** Only allow same-site relative redirects after age verification. */
export function sanitizeRedirectPath(path: string | null | undefined, fallback = "/") {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/verify-age")) return fallback;
  if (path.startsWith("/api/")) return fallback;
  return path;
}
