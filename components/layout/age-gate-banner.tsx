"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

const STORAGE_KEY = "manuelax-age-ack";

type AgeGateBannerProps = {
  message: string;
};

export function AgeGateBanner({ message }: AgeGateBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const ok = localStorage.getItem(STORAGE_KEY) === "1";
      setVisible(!ok);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="relative z-[60] border-b border-accent/30 bg-gradient-to-r from-accent/15 via-background to-accent/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-foreground sm:text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          {message}
        </p>
        <div className="flex shrink-0 gap-2">
          <Link
            href="https://www.google.com"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Leave
          </Link>
          <button
            type="button"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:brightness-110"
            onClick={() => {
              try {
                localStorage.setItem(STORAGE_KEY, "1");
              } catch {
                /* ignore */
              }
              setVisible(false);
            }}
          >
            I am 18+
          </button>
        </div>
      </div>
    </div>
  );
}
