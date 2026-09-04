"use client";

import { useEffect, useRef, useState } from "react";
import { adFramePath } from "@/lib/ads/network";

type AdFrameProps = {
  adId: string;
  width: number;
  height: number;
  title: string;
};

/**
 * Sandboxed host for a third-party ad tag.
 *
 * Two deliberate choices, both about speed:
 *
 * 1. The iframe is only created once the slot is near the viewport. Network
 *    scripts are the heaviest thing on an ad-supported page; creating them
 *    eagerly would load every slot's script during initial page load.
 * 2. `sandbox` withholds `allow-same-origin`, so the script runs in an opaque
 *    origin: no access to the site's DOM, cookies, or storage, and no ability
 *    to navigate the top-level page. `allow-scripts` and `allow-popups` are
 *    granted because ad tags need both to render and to open their landing page.
 */
export function AdFrame({ adId, width, height, title }: AdFrameProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = holderRef.current;
    if (!node || active) return;

    // No IntersectionObserver (very old browser): load immediately.
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      // Start loading slightly before the slot scrolls in, so the ad is
      // usually painted by the time it is actually on screen.
      { rootMargin: "300px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  return (
    <div ref={holderRef} className="h-full w-full">
      {active ? (
        <iframe
          src={adFramePath(adId)}
          title={title}
          width={width}
          height={height}
          loading="lazy"
          scrolling="no"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-full w-full border-0 bg-transparent"
        />
      ) : null}
    </div>
  );
}
