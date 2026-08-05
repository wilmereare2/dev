"use client";

import { useEffect, useState } from "react";

type Stats = {
  users: number;
  activeSubscriptions: number;
  openReports: number;
  openTickets: number;
};

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/admin/overview")
      .then((response) => response.json())
      .then((payload) => setStats(payload.stats ?? null));
  }, []);

  if (!stats) {
    return <p className="text-sm text-muted-foreground">Loading admin overview...</p>;
  }

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Active subscriptions", value: stats.activeSubscriptions },
    { label: "Open reports", value: stats.openReports },
    { label: "Open tickets", value: stats.openTickets },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl border border-border bg-surface/60 p-5">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
