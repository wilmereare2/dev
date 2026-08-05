"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/content/content-card";
import type { SanityContentCard } from "@/types/sanity-content";

export function CreatorAnalytics() {
  const [items, setItems] = useState<SanityContentCard[]>([]);

  useEffect(() => {
    void fetch("/api/recommendations")
      .then((response) => response.json())
      .then((payload) => setItems(payload.items ?? []));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold">Recommended catalog insights</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        AI-assisted recommendations based on platform engagement signals.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
