import { en, type MessageCatalogue, type MessageKey } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import { pt } from "@/lib/i18n/messages/pt";
import { fr } from "@/lib/i18n/messages/fr";
import { ht } from "@/lib/i18n/messages/ht";
import { nl } from "@/lib/i18n/messages/nl";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Every locale is typed as `MessageCatalogue`, so adding a key to `en` without
 * translating it — or mistyping one — is a build error rather than a string
 * that silently shows in English.
 */
export const messages: Record<Locale, MessageCatalogue> = { en, es, pt, fr, ht, nl };

export type { MessageKey, MessageCatalogue };
