"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PromotionItem = {
  id: string;
  title: string;
  body?: string | null;
  bannerUrl?: string | null;
  teaserVideoUrl?: string | null;
  couponCode?: string | null;
  discountPercent?: number | null;
  externalUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  } | null;
  business?: {
    id: string;
    name: string;
    slug: string;
    bannerUrl: string | null;
  } | null;
};

const STATUS_FILTERS = ["all", "published", "draft", "flagged", "removed"] as const;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ownerLabel(item: PromotionItem) {
  if (item.creator) return item.creator.name ?? item.creator.email;
  if (item.business) return item.business.name;
  return "Unknown member";
}

function statusClass(status: string) {
  if (status === "published") return "text-green-400";
  if (status === "flagged") return "text-amber-400";
  if (status === "removed") return "text-red-400";
  return "text-muted-foreground";
}

export function AdminPromotionsPanel() {
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const sinceRef = useRef(new Date().toISOString());

  const mergeItems = useCallback((incoming: PromotionItem[]) => {
    if (!incoming.length) return;
    setItems((current) => {
      const map = new Map(current.map((item) => [item.id, item]));
      for (const item of incoming) {
        map.set(item.id, item);
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
    const response = await fetch(`/api/admin/promotions${query}`);
    const payload = (await response.json()) as { items?: PromotionItem[] };
    setItems(payload.items ?? []);
    sinceRef.current = new Date().toISOString();
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;

    function connect() {
      const url = `/api/admin/promotions/stream?since=${encodeURIComponent(sinceRef.current)}`;
      source = new EventSource(url);
      source.onopen = () => setLive(true);
      source.onmessage = (event) => {
        try {
          const item = JSON.parse(event.data) as PromotionItem;
          mergeItems([item]);
          sinceRef.current = item.updatedAt;
        } catch {
          /* ignore malformed events */
        }
      };
      source.onerror = () => {
        setLive(false);
        source?.close();
        source = null;
        reconnectTimer = window.setTimeout(connect, 2500);
      };
    }

    connect();

    const poll = window.setInterval(() => {
      void fetch(`/api/admin/promotions${filter === "all" ? "" : `?status=${filter}`}`)
        .then((response) => response.json())
        .then((payload: { items?: PromotionItem[] }) => mergeItems(payload.items ?? []))
        .catch(() => undefined);
    }, 8000);

    return () => {
      source?.close();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.clearInterval(poll);
    };
  }, [filter, mergeItems]);

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  async function moderate(id: string, action: "publish" | "remove" | "flag" | "restore" | "delete") {
    setPendingId(id);
    const response = await fetch(`/api/admin/promotions/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });

    if (response.ok) {
      if (action === "delete") {
        setItems((current) => current.filter((item) => item.id !== id));
      } else {
        const payload = (await response.json()) as { promotion?: PromotionItem };
        if (payload.promotion) mergeItems([payload.promotion]);
      }
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Promotions monitoring
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Member promotions</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live feed of promotional posts from creators and businesses, including banners, copy, and coupon details.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          {live ? <Wifi className="size-4 text-accent" /> : <WifiOff className="size-4" />}
          {live ? "Live monitoring" : "Reconnecting…"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm capitalize transition",
              filter === value
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-muted-foreground hover:border-accent/40",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading promotions…
        </div>
      ) : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted-foreground">
          No promotions in this view yet.
        </p>
      ) : null}

      <div className="space-y-4">
        {visibleItems.map((item) => {
          const banner = item.bannerUrl || item.business?.bannerUrl;

          return (
            <article key={item.id} className="rounded-2xl border border-border bg-surface/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <span className={cn("text-xs uppercase tracking-wide", statusClass(item.status))}>
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ownerLabel(item)} · updated {formatWhen(item.updatedAt)}
                  </p>
                  {item.body ? <p className="mt-3 text-sm leading-relaxed">{item.body}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {item.couponCode ? <span>Code: {item.couponCode}</span> : null}
                    {item.discountPercent != null ? <span>{item.discountPercent}% off</span> : null}
                    {item.externalUrl ? (
                      <a href={item.externalUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                        External link
                      </a>
                    ) : null}
                    {item.teaserVideoUrl ? <span>Teaser video attached</span> : null}
                  </div>
                </div>

                {banner ? (
                  <div className="relative h-28 w-44 overflow-hidden rounded-xl border border-border/60 bg-background/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status !== "published" ? (
                  <Button size="sm" disabled={pendingId === item.id} onClick={() => moderate(item.id, "publish")}>
                    Publish
                  </Button>
                ) : null}
                {item.status !== "flagged" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingId === item.id}
                    onClick={() => moderate(item.id, "flag")}
                  >
                    Flag
                  </Button>
                ) : null}
                {item.status !== "removed" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingId === item.id}
                    onClick={() => moderate(item.id, "remove")}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingId === item.id}
                    onClick={() => moderate(item.id, "restore")}
                  >
                    Restore
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pendingId === item.id}
                  onClick={() => moderate(item.id, "delete")}
                >
                  Delete
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
