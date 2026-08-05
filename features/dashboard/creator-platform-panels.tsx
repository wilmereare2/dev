"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Analytics = {
  totals: {
    uploads: number;
    published: number;
    views: number;
    followers: number;
    subscribers: number;
    likes: number;
  };
  revenue: {
    tipsCents: number;
    ppvCents: number;
    subscriptionEstimateCents: number;
    totalCents: number;
  };
  bestPerforming: Array<{ id: string; title: string; viewCount: number; purchaseCount: number }>;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreatorAnalyticsPanel() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    void fetch("/api/creator/analytics")
      .then((r) => r.json())
      .then((payload) => setData(payload.analytics ?? null));
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Uploads", data.totals.uploads],
          ["Published", data.totals.published],
          ["Views", data.totals.views],
          ["Followers", data.totals.followers],
          ["Subscribers", data.totals.subscribers],
          ["Likes", data.totals.likes],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface/60 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Tips", money(data.revenue.tipsCents)],
          ["PPV", money(data.revenue.ppvCents)],
          ["Subscriptions (est.)", money(data.revenue.subscriptionEstimateCents)],
          ["Total (est.)", money(data.revenue.totalCents)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-surface/60 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold text-accent">{value}</p>
          </article>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Best performing content</h2>
        <ul className="mt-3 space-y-2">
          {data.bestPerforming.map((item) => (
            <li key={item.id} className="rounded-xl border border-border px-4 py-3 text-sm">
              <span className="font-medium">{item.title}</span>
              <span className="ml-3 text-muted-foreground">
                {item.viewCount} views · {item.purchaseCount} purchases
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CreatorEarningsPanel() {
  return <CreatorAnalyticsPanel />;
}

export function CreatorPromotionsPanel() {
  const [items, setItems] = useState<Array<{ id: string; title: string; couponCode?: string | null }>>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(30);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/creator/promotions");
    const payload = await response.json();
    setItems(payload.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPromotion(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/creator/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, couponCode, discountPercent }),
    });
    if (response.ok) {
      setTitle("");
      setBody("");
      setCouponCode("");
      setMessage("Promotion submitted for moderation review.");
      await load();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={createPromotion} className="space-y-3 rounded-2xl border border-border bg-surface/60 p-5">
        <h2 className="font-semibold">New promotional post</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="🔥 30% Off This Weekend"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Unlock my Premium Collection — expires in 18 hours"
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code"
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          />
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit">Submit promotion</Button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Your promotions</h2>
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border px-4 py-3 text-sm">
            <p className="font-medium">{item.title}</p>
            {item.couponCode ? <p className="text-muted-foreground">Code: {item.couponCode}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function BusinessDashboardPanel() {
  const [business, setBusiness] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/business/account")
      .then((r) => r.json())
      .then((payload) => setBusiness(payload.business ?? null));
  }, []);

  async function createBusiness(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/business/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, create: true }),
    });
    const payload = await response.json();
    if (response.ok) {
      setBusiness(payload.business);
      setMessage("Business account created.");
    }
  }

  if (!business) {
    return (
      <form onSubmit={createBusiness} className="max-w-md space-y-3 rounded-2xl border border-border bg-surface/60 p-5">
        <h2 className="font-semibold">Create business account</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Studio name"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          required
        />
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit">Create business profile</Button>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <h2 className="text-xl font-semibold">{business.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Slug: {business.slug}</p>
      <p className="mt-4 text-sm">
        Publish promotional campaigns, manage creators, and view business analytics from this hub.
      </p>
    </div>
  );
}
