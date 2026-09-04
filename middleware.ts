import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AGE_VERIFIED_COOKIE, isAgeVerifiedCookie } from "@/lib/auth/age-cookie";
import {
  LOCALE_COOKIE,
  isSupportedLocale,
  localeCookieOptions,
  negotiateLocale,
} from "@/lib/i18n";
import { applySecurityHeaders } from "@/middleware/security-headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const PUBLIC_PREFIXES = [
  "/verify-age",
  "/account",
  "/api/auth",
  "/api/compliance",
  "/api/health",
  "/api/webhooks",
  "/studio",
  "/privacy",
  "/terms",
  "/contact",
  "/faq",
  "/about",
  "/dmca",
  "/pricing",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Requests allowed per IP per minute. Configurable because the ceiling that
 * suits production is too low for load testing and automated sweeps.
 */
const GLOBAL_RATE_LIMIT = Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 180;

/**
 * A throttled page navigation used to render raw JSON in the browser. Answer
 * document requests with a real page and API requests with JSON.
 */
function tooManyRequests(request: NextRequest, resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const headers = { "Retry-After": String(retryAfter), "Cache-Control": "no-store" };

  const wantsHtml =
    request.headers.get("accept")?.includes("text/html") &&
    !request.nextUrl.pathname.startsWith("/api/");

  if (!wantsHtml) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers });
  }

  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Too many requests</title>
<style>
:root{color-scheme:dark}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#030305;color:#f8f8fb;
font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;padding:1.5rem}
main{max-width:26rem;text-align:center}
h1{font-size:1.35rem;margin:0 0 .5rem}
p{margin:0 0 1.25rem;color:#9b9bb0}
a{display:inline-block;padding:.65rem 1.25rem;border-radius:.75rem;background:#f43f5e;
color:#fff1f2;text-decoration:none;font-weight:600}
</style></head><body><main>
<h1>Too many requests</h1>
<p>You have made a lot of requests in a short time. Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} and try again.</p>
<a href="${request.nextUrl.pathname}">Try again</a>
</main></body></html>`;

  return new NextResponse(body, {
    status: 429,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

function redirectToVerifyAge(request: NextRequest) {
  const url = request.nextUrl.clone();
  const redirectTarget = `${url.pathname}${url.search}`;
  url.pathname = "/verify-age";
  url.search = "";
  url.searchParams.set("redirect", redirectTarget);
  return NextResponse.redirect(url);
}

function applyLocaleCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isSupportedLocale(existing)) {
    return response;
  }

  const locale = negotiateLocale(request.headers.get("accept-language"));
  response.cookies.set(
    LOCALE_COOKIE,
    locale,
    localeCookieOptions(locale, request.nextUrl.protocol === "https:"),
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  const limit = rateLimit(`global:${clientIp(request)}`, GLOBAL_RATE_LIMIT, 60_000);
  if (!limit.allowed) {
    return tooManyRequests(request, limit.resetAt);
  }

  const response = applySecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/studio")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (isPublicPath(pathname)) {
    return applyLocaleCookie(request, response);
  }

  // API routes enforce their own auth; do not redirect them to the age gate.
  if (pathname.startsWith("/api/")) {
    return applyLocaleCookie(request, response);
  }

  const cookieValue = request.cookies.get(AGE_VERIFIED_COOKIE)?.value;
  if (await isAgeVerifiedCookie(cookieValue)) {
    return applyLocaleCookie(request, response);
  }

  return applyLocaleCookie(request, redirectToVerifyAge(request));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|gif|webp)$).*)"],
};
