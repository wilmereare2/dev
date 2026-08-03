import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/middleware/security-headers";

/**
 * Phase 1: security headers only.
 * Auth gates + rate limiting land in later phases.
 */
export function middleware(request: NextRequest) {
  const response = applySecurityHeaders(NextResponse.next());

  if (request.nextUrl.pathname.startsWith("/studio")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
