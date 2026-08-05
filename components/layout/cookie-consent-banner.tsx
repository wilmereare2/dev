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

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur">
      <p className="text-sm text-muted-foreground">
        We use essential cookies for sign-in, age verification, and preferences. See our{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        type="button"
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
      >
        Accept
      </button>
    </div>
  );
}
