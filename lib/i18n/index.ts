export const messages = {
  en: {
    library: "Library",
    settings: "Settings",
    subscriptions: "Subscriptions",
    verifyAge: "Verify your age",
    search: "Search",
  },
  es: {
    library: "Biblioteca",
    settings: "Configuración",
    subscriptions: "Suscripciones",
    verifyAge: "Verifica tu edad",
    search: "Buscar",
  },
} as const;

export type Locale = keyof typeof messages;

export function getMessages(locale: string) {
  return messages[locale as Locale] ?? messages.en;
}

export function t(locale: string, key: keyof (typeof messages)["en"]) {
  return getMessages(locale)[key];
}
