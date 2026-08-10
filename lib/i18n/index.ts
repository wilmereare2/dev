import { messages, type MessageKey } from "@/lib/i18n/messages";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/lib/i18n/locales";

export { messages, type MessageKey };
export {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  negotiateLocale,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/locales";
export { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, localeCookieOptions } from "@/lib/i18n/cookie";
export { NAV_PATH_KEYS, navMessageKey } from "@/lib/i18n/nav";

export function getMessages(locale: string) {
  const resolved = resolveLocale(locale);
  return messages[resolved];
}

export function translate(locale: string, key: MessageKey) {
  const resolved = resolveLocale(locale);
  return messages[resolved][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}

/** @deprecated Use translate() or useI18n().t */
export function t(locale: string, key: MessageKey) {
  return translate(locale, key);
}
