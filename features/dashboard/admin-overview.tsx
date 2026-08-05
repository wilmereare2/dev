"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  users: number;
  activeSubscriptions: number;
  openReports: number;
  openTickets: number;
  promotions?: number;
};

type AdminCategory = {
  slug: string;
  name: string;
  description: string | null;
  href: string;
};

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/overview").then((response) => response.json()),
      fetch("/api/admin/promotions?counts=1").then((response) => response.json()),
      fetch("/api/admin/categories").then((response) => response.json()),
    ]).then(([overviewPayload, promotionsPayload, categoriesPayload]) => {
      setStats({
        ...(overviewPayload.stats ?? {}),
        promotions: promotionsPayload.counts?.total ?? 0,
      });
      setCategories(categoriesPayload.categories ?? []);
    });
  }, []);

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading admin overview...</p>;
  }

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Active subscriptions", value: stats.activeSubscriptions },
    { label: "Open reports", value: stats.openReports },
    { label: "Open tickets", value: stats.openTickets },
    { label: "Promotions", value: stats.promotions ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-border bg-surface/60 p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Administrator management zones</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-accent/50"
            >
              <p className="font-medium">{category.name}</p>
              {category.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
