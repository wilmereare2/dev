"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CreatorStats = {
  followers: number;
  likes: number;
  comments: number;
  pendingUploads: number;
  tipRevenueCents: number;
  ppvRevenueCents: number;
  activeSubscribers: number;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreatorOverview() {
  const [stats, setStats] = useState<CreatorStats | null>(null);

  useEffect(() => {
    void fetch("/api/creator/overview")
      .then((response) => response.json())
      .then((payload) => setStats(payload.stats ?? null));
  }, []);

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading creator overview...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          ["Followers", stats.followers],
          ["Likes", stats.likes],
          ["Comments", stats.comments],
          ["Pending uploads", stats.pendingUploads],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface/60 p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tip revenue", money(stats.tipRevenueCents)],
          ["PPV revenue", money(stats.ppvRevenueCents)],
          ["Active subscribers", stats.activeSubscribers],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface/60 p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-accent">{value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/creator-dashboard/content/new" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          Upload content
        </Link>
        <Link href="/creator-dashboard/promotions" className="rounded-full border border-border px-4 py-2 text-sm">
          Create promotion
        </Link>
        <Link href="/creator-dashboard/earnings" className="rounded-full border border-border px-4 py-2 text-sm">
          View earnings
        </Link>
      </div>
    </div>
  );
}
