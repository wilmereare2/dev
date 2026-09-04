"use client";

import { useMemo, useState } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchForm } from "@/features/search/search-form";
import { ShowcaseCard, ShowcaseCardSkeleton } from "@/components/showcase/showcase-card";
import type { SanityCategoryCard, SanityContentCard } from "@/types/sanity-content";
import { cn } from "@/lib/utils";

const BROWSE_TABS = [
  { href: "/explore", label: "Explore" },
  { href: "/trending", label: "Trending" },
  { href: "/newest", label: "Newest" },
  { href: "/popular", label: "Popular" },
] as const;

type SortMode = "latest" | "featured" | "title";

type ShowcaseGalleryProps = {
  items: SanityContentCard[];
  categories?: SanityCategoryCard[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  activeTab?: string;
  initialSearchQuery?: string;
};


/**
 * Preferred number of real cards before the in-feed native slot.
 *
 * Clamped to the feed length, so a short feed still gets the slot at its end
 * instead of dropping it entirely — with a handful of titles a fixed offset
 * meant the slot never rendered at all.
 */
const IN_FEED_AD_AFTER = 3;

export function ShowcaseGallery({
  items,
  categories = [],
  title = "Explore",
  description,
  emptyMessage = "No content published yet.",
  activeTab = "/explore",
  initialSearchQuery = "",
}: ShowcaseGalleryProps) {
  const pathname = usePathname();
  const currentTab = BROWSE_TABS.find((tab) => pathname === tab.href || activeTab === tab.href)?.href ?? activeTab;
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  const filteredItems = useMemo(() => {
    let next = [...items];

    if (categoryFilter !== "all") {
      next = next.filter((item) => item.categories?.some((cat) => cat.slug === categoryFilter));
    }

    if (sortMode === "featured") {
      next.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    } else if (sortMode === "title") {
      next.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      next.sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return next;
  }, [categoryFilter, items, sortMode]);

  return (
    <div className="w-full py-8">
      <header className="border-b border-border/60 pb-5">
        {/*
          Container-based, not viewport-based: with the ad rail present the
          content column can be ~600px wide at a 1280px viewport, and a
          viewport `lg:flex-row` put the title and a 448px search box in a row
          that did not fit.
        */}
        <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-end @2xl:justify-between">
          <div className="min-w-0">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">Discover</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
            ) : items.length ? (
              <p className="mt-2 text-sm text-muted-foreground">{items.length} titles to browse</p>
            ) : null}
          </div>
          <div className="w-full min-w-0 max-w-md">
            <SearchForm initialQuery={initialSearchQuery} />
          </div>
        </div>

        <nav className="mt-5 flex gap-1 overflow-x-auto pb-0.5" aria-label="Browse collections">
          {BROWSE_TABS.map((tab) => {
            const active = currentTab === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="showcase-sort">
            Sort
          </label>
          <select
            id="showcase-sort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="h-9 rounded-lg border border-border bg-background/80 px-3 text-xs outline-none focus-visible:border-accent/60"
          >
            <option value="latest">Latest</option>
            <option value="featured">Featured first</option>
            <option value="title">Title A–Z</option>
          </select>

          {categories.length ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                  categoryFilter === "all"
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground",
                )}
              >
                All
              </button>
              {categories.slice(0, 12).map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.slug)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                    categoryFilter === cat.slug
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground",
                  )}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
        {filteredItems.length
          ? filteredItems.flatMap((item, index) => {
              const card = <ShowcaseCard key={item._id} item={item} priority={index < 4} />;

              // One native slot inside the browsing flow, after the first row
              // where possible and at the end of a shorter feed.
              const adAfter = Math.min(IN_FEED_AD_AFTER, filteredItems.length);
              if (index !== adAfter - 1) return [card];
              return [
                card,
                <AdSlot key="in-feed-ad" placement="in_feed" collapseWhenEmpty className="h-full" />,
              ];
            })
          : items.length
            ? (
                <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
                  No titles match the selected filters.
                </p>
              )
            : Array.from({ length: 8 }).map((_, i) => <ShowcaseCardSkeleton key={i} />)}
      </div>

      {!items.length ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : filteredItems.length > 0 ? (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Showing {filteredItems.length} of {items.length} titles
        </p>
      ) : null}
    </div>
  );
}
