"use client";

import { useState } from "react";
import Link from "next/link";
import { ContentCard } from "@/components/content/content-card";
import type { SanityContentCard } from "@/types/sanity-content";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/utils/format";

type HistoryItem = { item: SanityContentCard; progressMs: number };

type LibraryViewProps = {
  favorites: SanityContentCard[];
  watchLater: SanityContentCard[];
  history: HistoryItem[];
};

type Tab = "favorites" | "watchLater" | "history";

export function LibraryView({ favorites, watchLater, history }: LibraryViewProps) {
  const [tab, setTab] = useState<Tab>("favorites");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "favorites", label: "Favorites", count: favorites.length },
    { id: "watchLater", label: "Watch later", count: watchLater.length },
    { id: "history", label: "History", count: history.length },
  ];

  const items =
    tab === "favorites" ? favorites : tab === "watchLater" ? watchLater : history.map((h) => h.item);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Library</h1>
      <p className="mt-2 text-secondary">Favorites, watch later, and recently viewed</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              tab === entry.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label} ({entry.count})
          </button>
        ))}
      </div>

      {tab === "history" && history.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {history.map(({ item, progressMs }) => (
            <div key={item._id} className="space-y-2">
              <ContentCard item={item} />
              <p className="text-xs text-muted-foreground">
                Resume at {formatDuration(Math.floor(progressMs / 1000))}{" "}
                <Link href={`/content/${item.slug}`} className="text-accent hover:underline">
                  Continue
                </Link>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.length ? (
            items.map((item) => <ContentCard key={item._id} item={item} />)
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">
              Nothing here yet. Save titles from a content page while signed in.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
