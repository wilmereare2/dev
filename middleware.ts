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

  const limit = rateLimit(`global:${clientIp(request)}`, 180, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const response = applySecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/studio")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (isPublicPath(pathname)) {
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
