import type { Locale } from "@/lib/i18n/locales";

export const LOCALE_COOKIE = "manuelax-locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function localeCookieOptions(locale: Locale, secure: boolean) {
  return {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure,
  };
}
