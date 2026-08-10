import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/i18n/cookie";
import { isSupportedLocale, resolveLocale } from "@/lib/i18n/locales";
import { getUserSettings } from "@/services/user/settings";

export async function resolveAppLocale(userId?: string | null) {
  if (userId) {
    const settings = await getUserSettings(userId);
    if (settings?.locale && isSupportedLocale(settings.locale)) {
      return settings.locale;
    }
  }

  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
