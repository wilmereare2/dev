import { NextResponse } from "next/server";

/**
 * Paths that the site frames itself.
 *
 * Third-party ad tags render inside a sandboxed iframe served from our own
 * origin. A blanket `X-Frame-Options: DENY` would block that frame too, so
 * these paths get `SAMEORIGIN` plus an explicit `frame-ancestors 'self'`.
 */
const SELF_FRAMEABLE_PREFIXES = ["/api/ads/frame/"];

export function applySecurityHeaders(response: NextResponse, pathname?: string) {
  const selfFrameable =
    pathname !== undefined && SELF_FRAMEABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (selfFrameable) {
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}
