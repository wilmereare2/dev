"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { AdPlacement } from "@/lib/ads/placements";
import { requestJson } from "@/lib/api/client";
import type { PublicAdPayload } from "@/services/ads/advertisements";

type AdMap = Record<string, PublicAdPayload | null>;

type AdContextValue = {
  register: (placement: AdPlacement) => void;
  ads: AdMap;
  loaded: boolean;
  reportImpression: (adId: string, dedupeKey: string) => void;
};

const AdContext = createContext<AdContextValue | null>(null);

/**
 * Resolves every ad slot on a page with a single request.
 *
 * Slots register themselves on mount; the registrations are collected for one
 * tick and then fetched together, so a page carrying a banner plus a four-slot
 * rail costs one request and one database round trip rather than one per slot.
 * Impressions are batched the same way.
 */
export function AdProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ads, setAds] = useState<AdMap>({});
  const [loaded, setLoaded] = useState(false);

  const pendingRef = useRef<Set<string>>(new Set());
  const requestedRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const impressionsRef = useRef<Map<string, { adId: string; dedupeKey: string }>>(new Map());
  const impressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new page has its own slots and its own impression scope.
  useEffect(() => {
    pendingRef.current = new Set();
    requestedRef.current = new Set();
    impressionsRef.current = new Map();
    setAds({});
    setLoaded(false);
  }, [pathname]);

  const flush = useCallback(async () => {
    flushTimerRef.current = null;
    const batch = [...pendingRef.current];
    pendingRef.current = new Set();
    if (!batch.length) return;

    const result = await requestJson<{ ads?: AdMap }>(
      `/api/ads/serve?placements=${encodeURIComponent(batch.join(","))}`,
      { cache: "no-store" },
    );

    // A failed lookup leaves the slots empty rather than showing an error.
    const next = result.ok ? (result.data.ads ?? {}) : {};
    setAds((current) => {
      const merged = { ...current };
      for (const placement of batch) merged[placement] = next[placement] ?? null;
      return merged;
    });
    setLoaded(true);
  }, []);

  const register = useCallback(
    (placement: AdPlacement) => {
      if (requestedRef.current.has(placement)) return;
      requestedRef.current.add(placement);
      pendingRef.current.add(placement);

      if (flushTimerRef.current === null) {
        flushTimerRef.current = setTimeout(() => void flush(), 0);
      }
    },
    [flush],
  );

  const flushImpressions = useCallback(async () => {
    impressionTimerRef.current = null;
    const batch = [...impressionsRef.current.values()];
    impressionsRef.current = new Map();
    if (!batch.length) return;

    await requestJson("/api/ads/impressions", { method: "POST", body: { impressions: batch } });
  }, []);

  const reportImpression = useCallback(
    (adId: string, dedupeKey: string) => {
      impressionsRef.current.set(`${adId}:${dedupeKey}`, { adId, dedupeKey });
      if (impressionTimerRef.current === null) {
        // Short window so slots scrolled into view together travel as one call.
        impressionTimerRef.current = setTimeout(() => void flushImpressions(), 600);
      }
    },
    [flushImpressions],
  );

  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (impressionTimerRef.current) clearTimeout(impressionTimerRef.current);
    },
    [],
  );

  const value = useMemo<AdContextValue>(
    () => ({ register, ads, loaded, reportImpression }),
    [register, ads, loaded, reportImpression],
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export type UseAdResult = {
  ad: PublicAdPayload | null;
  loading: boolean;
  reportImpression: (adId: string, dedupeKey: string) => void;
};

/**
 * Subscribes a slot to the page's batched ad request.
 *
 * Falls back to standalone behaviour when no provider is mounted, so an AdSlot
 * still works outside the site shell.
 */
export function useAd(placement: AdPlacement): UseAdResult {
  const context = useContext(AdContext);

  useEffect(() => {
    context?.register(placement);
  }, [context, placement]);

  if (!context) {
    return { ad: null, loading: false, reportImpression: () => {} };
  }

  return {
    ad: context.ads[placement] ?? null,
    loading: !context.loaded && !(placement in context.ads),
    reportImpression: context.reportImpression,
  };
}

export function useHasAdProvider() {
  return useContext(AdContext) !== null;
}
