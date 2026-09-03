"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type FinanceData = {
  revenueCents: number;
  paymentCount: number;
  failedPayments: number;
  tipsCents: number;
  purchasesCents: number;
  recentPayments: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    description: string | null;
    createdAt: string;
    user: { name: string | null; email: string };
  }>;
  recentSubscriptions: Array<{
    id: string;
    status: string;
    plan: string;
    priceCents: number;
    user: { name: string | null; email: string };
    periodEnd: string | null;
  }>;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/finance");
    setData(await response.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Loading finance data…</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Finance" description="Subscriptions, payments, tips, and purchases. Payment credentials are never shown." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Revenue (recent)</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(data.revenueCents)}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Payments</p>
          <p className="mt-1 text-2xl font-semibold">{data.paymentCount}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Failed payments</p>
          <p className="mt-1 text-2xl font-semibold">{data.failedPayments}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Tips + PPV</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(data.tipsCents + data.purchasesCents)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold">Recent payments</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {data.recentPayments.length ? data.recentPayments.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
              <span>{p.user.name ?? p.user.email} · {p.description ?? p.provider}</span>
              <span className={p.status === "succeeded" ? "text-emerald-400" : "text-muted-foreground"}>
                {formatMoney(p.amountCents)} · {p.status}
              </span>
            </li>
          )) : (
            <li className="text-muted-foreground">No payments recorded.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold">Recent subscriptions</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {data.recentSubscriptions.length ? data.recentSubscriptions.map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
              <span>{s.user.name ?? s.user.email} · {s.plan}</span>
              <span className="text-muted-foreground capitalize">{s.status} · {formatMoney(s.priceCents)}</span>
            </li>
          )) : (
            <li className="text-muted-foreground">No subscriptions.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
