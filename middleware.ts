import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AGE_VERIFIED_COOKIE, isAgeVerifiedCookie } from "@/lib/auth/age-cookie";
import { applySecurityHeaders } from "@/middleware/security-headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const PUBLIC_PREFIXES = [
  "/verify-age",
  "/account",
  "/api/auth",
  "/api/compliance",
  "/api/webhooks",
  "/studio",
  "/privacy",
  "/terms",
  "/contact",
  "/faq",
  "/about",
  "/dmca",
  "/pricing",
  "/messages",
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
    return response;
  }

  const cookieValue = request.cookies.get(AGE_VERIFIED_COOKIE)?.value;
  if (await isAgeVerifiedCookie(cookieValue)) {
    return response;
  }

  return redirectToVerifyAge(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|gif|webp)$).*)"],
};
