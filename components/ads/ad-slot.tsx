"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  AD_PLACEMENTS,
  getPlacementAspectRatio,
  type AdPlacement,
} from "@/lib/ads/placements";
import type { PublicAdPayload } from "@/services/ads/advertisements";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  placement: AdPlacement;
  className?: string;
};

function pickResponsiveImage(ad: PublicAdPayload, viewport: "mobile" | "tablet" | "desktop") {
  if (viewport === "mobile" && ad.imageUrlMobile) return ad.imageUrlMobile;
  if (viewport === "tablet" && ad.imageUrlTablet) return ad.imageUrlTablet;
  return ad.imageUrl ?? ad.imageUrlTablet ?? ad.imageUrlMobile;
}

function useAdViewport() {
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const sync = () => {
      const width = window.innerWidth;
      if (width < 640) setViewport("mobile");
      else if (width < 1024) setViewport("tablet");
      else setViewport("desktop");
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return viewport;
}

export function AdSlot({ placement, className }: AdSlotProps) {
  const reactId = useId();
  const [ad, setAd] = useState<PublicAdPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const impressionSent = useRef(false);
  const containerRef = useRef<HTMLElement>(null);
  const viewport = useAdViewport();

  const dedupeKey = `${placement}-${reactId}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    void fetch(`/api/ads/serve?placement=${encodeURIComponent(placement)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { ad?: PublicAdPayload | null }) => {
        if (cancelled) return;
        setAd(payload.ad ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placement]);

  const trackImpression = useCallback(() => {
    if (!ad || impressionSent.current) return;
    impressionSent.current = true;
    void fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: ad.id, dedupeKey }),
    });
  }, [ad, dedupeKey]);

  useEffect(() => {
    if (!ad || !containerRef.current) return;

    const node = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackImpression();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ad, trackImpression]);

  async function handleClick(event: React.MouseEvent) {
    if (!ad) return;
    event.preventDefault();

    try {
      const response = await fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id }),
      });
      const payload = (await response.json()) as { destinationUrl?: string };
      if (payload.destinationUrl) {
        window.open(payload.destinationUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(ad.destinationUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-2xl border border-border/40 bg-muted/30",
          className,
        )}
        style={{ aspectRatio: getPlacementAspectRatio(placement) }}
        aria-hidden
      />
    );
  }

  if (error || !ad) return null;

  const imageSrc = pickResponsiveImage(ad, viewport);
  if (!imageSrc) return null;

  const placementMeta = AD_PLACEMENTS[placement];
  const alt = ad.altText || `${ad.advertiserName}: ${ad.title}`;

  return (
    <aside
      ref={containerRef}
      className={cn("group relative overflow-hidden rounded-2xl border border-border/50 bg-surface/40", className)}
      aria-label={`Advertisement from ${ad.advertiserName}`}
    >
      <a
        href={ad.destinationUrl}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block"
      >
        <div
          className="relative w-full overflow-hidden bg-muted/20"
          style={{ aspectRatio: getPlacementAspectRatio(placement) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={alt} className="h-full w-full object-cover transition group-hover:scale-[1.01]" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="truncate">
            <span className="font-medium text-foreground/80">{ad.advertiserName}</span>
            <span className="mx-1.5 text-border">·</span>
            {ad.title}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 uppercase tracking-wide">
            Ad
            <ExternalLink className="size-3" aria-hidden />
          </span>
        </div>
      </a>
      <span className="sr-only">{placementMeta.label}</span>
    </aside>
  );
}

/** Alias for `<Ad placement="..." />` usage. */
export const Ad = AdSlot;
