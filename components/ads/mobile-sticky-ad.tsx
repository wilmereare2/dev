"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { useAd } from "@/components/ads/ad-context";

const DISMISS_KEY = "mx-sticky-ad-dismissed";

/**
 * Sticky bottom banner for narrow screens.
 *
 * Hidden from `sm` up, dismissible, and remembered for the session so it does
 * not reappear on every navigation. It renders nothing at all when no ad is
 * booked, so it never reserves space or covers content for no reason.
 */
export function MobileStickyAd() {
  const { ad } = useAd("mobile_sticky_bottom");
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-center pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="relative w-full max-w-[420px] px-2 pb-2">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss advertisement"
          className="absolute -top-2 right-3 z-10 inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-md backdrop-blur"
        >
          <X className="size-3.5" aria-hidden />
        </button>
        <AdSlot placement="mobile_sticky_bottom" collapseWhenEmpty className="shadow-2xl" />
      </div>
    </div>
  );
}
