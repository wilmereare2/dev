"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { ExternalLink } from "lucide-react";
import {
  AD_PLACEMENTS,
  getPlacementAspectRatio,
  getPlacementDeviceClass,
  type AdPlacement,
} from "@/lib/ads/placements";
import { useAd } from "@/components/ads/ad-context";
import { AdFrame } from "@/components/ads/ad-frame";
import { isNetworkCreative } from "@/lib/ads/network";
import type { PublicAdPayload } from "@/services/ads/advertisements";
import { requestJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  placement: AdPlacement;
  className?: string;
  /** Render nothing at all (no reserved space) until an ad is known. */
  collapseWhenEmpty?: boolean;
};

/**
 * Resolves the banner sources for a `<picture>` element.
 *
 * The variant is chosen by the browser from media queries rather than by
 * measuring `window.innerWidth` in an effect. Reading the viewport in JS meant
 * the first paint always assumed desktop, so phones downloaded the desktop
 * banner and then swapped it — two requests and a visible flash.
 */
function resolveBannerSources(ad: PublicAdPayload) {
  const base = ad.imageUrl ?? ad.imageUrlTablet ?? ad.imageUrlMobile ?? null;
  if (!base) return null;

  const mobile = ad.imageUrlMobile ?? base;
  const tablet = ad.imageUrlTablet ?? base;

  return {
    base,
    // Only emit a <source> when it would actually load something different.
    mobile: mobile === base ? null : mobile,
    tablet: tablet === base ? null : tablet,
  };
}

export function AdSlot({ placement, className, collapseWhenEmpty }: AdSlotProps) {
  const reactId = useId();
  const { ad, loading, reportImpression } = useAd(placement);
  const impressionSent = useRef(false);
  const containerRef = useRef<HTMLElement>(null);

  const dedupeKey = `${placement}-${reactId}`;
  const visible = Boolean(ad);

  const trackImpression = useCallback(() => {
    if (!ad || impressionSent.current) return;
    impressionSent.current = true;
    reportImpression(ad.id, dedupeKey);
  }, [ad, dedupeKey, reportImpression]);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    const node = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) trackImpression();
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, trackImpression]);

  async function handleClick(event: React.MouseEvent) {
    if (!ad) return;
    event.preventDefault();

    const result = await requestJson<{ destinationUrl?: string }>("/api/ads/click", {
      method: "POST",
      body: { adId: ad.id },
    });

    // Fall back to the known destination so a failed count never blocks the click.
    const destination = (result.ok && result.data.destinationUrl) || ad.destinationUrl;
    window.open(destination, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    if (collapseWhenEmpty) return null;
    return (
      <div
        className={cn(
          "mx-auto w-full animate-pulse rounded-2xl border border-border/40 bg-muted/30",
          getPlacementDeviceClass(placement),
          className,
        )}
        style={{
          aspectRatio: getPlacementAspectRatio(placement),
          maxWidth: AD_PLACEMENTS[placement].width,
        }}
        aria-hidden
      />
    );
  }

  if (!visible || !ad) return null;

  const network = isNetworkCreative(ad.creativeType);
  const sources = network ? null : resolveBannerSources(ad);

  // A direct-sold slot with no usable banner has nothing to show.
  if (!network && !sources) return null;

  const placementMeta = AD_PLACEMENTS[placement];
  const alt = ad.altText || `${ad.advertiserName}: ${ad.title}`;

  // Never render a creative wider than it was designed for: stretching a
  // 728x90 leaderboard across a 1200px column only upscales and blurs it.
  const compactLabel = placementMeta.height <= 100;

  if (network) {
    return (
      <aside
        ref={containerRef}
        className={cn(
          "group relative mx-auto w-full overflow-hidden rounded-2xl border border-border/50 bg-surface/40",
          getPlacementDeviceClass(placement),
          className,
        )}
        style={{ maxWidth: placementMeta.width }}
        aria-label={`Advertisement from ${ad.networkName ?? ad.advertiserName}`}
      >
        <div
          className="relative w-full overflow-hidden bg-muted/20"
          style={{ aspectRatio: getPlacementAspectRatio(placement) }}
        >
          <AdFrame
            adId={ad.id}
            width={placementMeta.width}
            height={placementMeta.height}
            title={`Advertisement — ${ad.networkName ?? ad.advertiserName}`}
          />
        </div>
        <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85">
          Ad
        </span>
        <span className="sr-only">{placementMeta.label}</span>
      </aside>
    );
  }

  return (
    <aside
      ref={containerRef}
      className={cn(
        "group relative mx-auto w-full overflow-hidden rounded-2xl border border-border/50 bg-surface/40",
        getPlacementDeviceClass(placement),
        className,
      )}
      style={{ maxWidth: placementMeta.width }}
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
          <picture>
            {sources?.mobile ? <source media="(max-width: 639px)" srcSet={sources.mobile} /> : null}
            {sources?.tablet ? <source media="(max-width: 1023px)" srcSet={sources.tablet} /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sources!.base}
              alt={alt}
              loading="lazy"
              decoding="async"
              width={placementMeta.width}
              height={placementMeta.height}
              className="h-full w-full object-cover transition group-hover:scale-[1.01]"
            />
          </picture>
        </div>
        {/*
          Short units (a 320x50 sticky, a 728x90 leaderboard) would be doubled
          in height by a full disclosure bar, so those get a compact overlay
          badge instead. Every ad still carries a visible "Ad" label.
        */}
        {compactLabel ? (
          <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85">
            Ad
          </span>
        ) : (
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
        )}
      </a>
      <span className="sr-only">{placementMeta.label}</span>
    </aside>
  );
}

/** Alias for `<Ad placement="..." />` usage. */
export const Ad = AdSlot;
