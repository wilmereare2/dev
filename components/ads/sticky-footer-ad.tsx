"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { useAd } from "@/components/ads/ad-context";

const DISMISS_KEY = "mx-sticky-footer-dismissed";

/**
 * Sticky footer banner for desktop.
 *
 * Anchored to the viewport bottom while scrolling, dismissible, and remembered
 * for the session. Renders nothing when unsold, so it never covers content or
 * reserves space for an empty slot.
 *
 * The mobile equivalent is `MobileStickyAd`; the two are device-scoped in CSS
 * so only one can ever be on screen.
 */
export function StickyFooterAd() {
  const { ad } = useAd("sticky_footer");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable — dismissal is per-render only */
    }
  }

  if (dismissed || !ad) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center pb-3 md:flex">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss advertisement"
          className="absolute -right-2 -top-2 z-10 inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-md backdrop-blur hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
        <AdSlot placement="sticky_footer" collapseWhenEmpty className="shadow-2xl" />
      </div>
    </div>
  );
}
