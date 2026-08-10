"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "manuelax-cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--site-bottom-offset", visible ? "3.5rem" : "0px");
    return () => {
      document.documentElement.style.setProperty("--site-bottom-offset", "0px");
    };
  }, [visible]);

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div className="relative z-40 border-t border-border/60 bg-background shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Essential cookies for sign-in, age verification, and preferences.{" "}
          <Link href="/privacy" className="font-medium text-accent hover:underline">
            Privacy Policy
          </Link>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:brightness-110 sm:text-sm"
          onClick={accept}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
