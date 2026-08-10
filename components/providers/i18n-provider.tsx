"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/cookie";
import { translate, type Locale, type MessageKey } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey) => string;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export function I18nProvider({ locale: initialLocale, children }: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    if (match?.[1] === initialLocale) return;
    document.cookie = `${LOCALE_COOKIE}=${initialLocale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
  }, [initialLocale]);

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  const setLocale = useCallback(
    async (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;

      try {
        await fetch("/api/user/settings/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
      } catch {
        /* guest users or offline — cookie is enough */
      }

      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
