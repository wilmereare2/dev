/**
 * Languages spoken across Latin America and the Caribbean.
 *
 * Spanish and Portuguese cover the overwhelming majority of the region;
 * English (Belize, Guyana, Jamaica, Trinidad), French (Haiti, French Guiana,
 * Guadeloupe, Martinique), Haitian Creole (Haiti's majority language) and Dutch
 * (Suriname, Curaçao, Aruba) cover the rest.
 *
 * Codes are base language tags. Region-specific browser tags such as `pt-BR`
 * or `es-MX` are matched by prefix during negotiation.
 */
export const SUPPORTED_LOCALES = ["es", "pt", "en", "fr", "ht", "nl"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/** Each label is written in its own language, as language pickers should be. */
export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  pt: "Português (Brasil)",
  en: "English",
  fr: "Français",
  ht: "Kreyòl Ayisyen",
  nl: "Nederlands",
};

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Picks the best supported locale from an Accept-Language header.
 *
 * Matching is by prefix, so `pt-BR`, `es-419`, `es-MX` and `fr-HT` all resolve
 * to the right catalogue.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage?.trim()) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferences) {
    // Haitian Creole is `ht`; check it before the generic French fallback.
    const base = tag.split("-")[0];
    const match = SUPPORTED_LOCALES.find((locale) => locale === base);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}
