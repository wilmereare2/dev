"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BillingReturnBanner } from "@/components/billing/billing-return-banner";
import { PromotionGalleryCard } from "@/components/promotions/promotion-gallery-card";
import type { PromotionListEntry } from "@/components/promotions/promotion-entry-utils";
import {
  entryOwner,
  entryVisibility,
} from "@/components/promotions/promotion-entry-utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VisibilityFilter = "all" | "public" | "followers" | "subscribers";

const FILTERS: { id: VisibilityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "followers", label: "Followers" },
  { id: "subscribers", label: "Subscribers" },
];

type PromotionsHubProps = {
  entries: PromotionListEntry[];
};

export function PromotionsHub({ entries }: PromotionsHubProps) {
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const visibility = entryVisibility(entry).toLowerCase();
      if (filter !== "all" && visibility !== filter) return false;
      if (!normalized) return true;
      const haystack = [
        entry.item.title,
        "body" in entry.item ? entry.item.body : "",
        "description" in entry.item ? entry.item.description : "",
        entryOwner(entry),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [entries, filter, query]);

  return (
    <section className="w-full py-8">
      <BillingReturnBanner successMessage="Payment complete. Your access has been updated." />
      <PageHeader
        eyebrow="Promotions"
        title="Deals & member posts"
        description="Discover creator deals, promotions, and member-only content. Access rules apply on each post page."
      />

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Promotion filters" className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                filter === id
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search promotions…"
            className="pl-10"
            aria-label="Search promotions"
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
        {filter !== "all" ? ` · ${FILTERS.find((item) => item.id === filter)?.label}` : ""}
      </p>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No promotions found"
            description="Try another filter or check back later for new deals and member posts."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((entry, index) => (
              <PromotionGalleryCard
                key={`${entry.kind}-${entry.item.id}`}
                entry={entry}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Creators can submit coupon campaigns from{" "}
        <Link href="/creator-dashboard/promotions" className="text-accent hover:underline">
          Creator dashboard → Promotions
        </Link>
        .
      </p>
    </section>
  );
}
