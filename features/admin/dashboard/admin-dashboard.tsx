"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";

type Analytics = {
  preset: string;
  totals: {
    users: number;
    creators: number;
    publishedContent: number;
    activeSubscriptions: number;
    openReports: number;
    revenueCents: number;
    adImpressions: number;
    adCtr: number;
    storageBytes: number;
  };
  growth: { newUsersToday: number; newUsersWeek: number; newUsersMonth: number };
  queues: { pendingCreators: number; pendingUploads: number; flaggedUploads: number };
  signupTrend: Array<{ date: string; count: number }>;
  recentAudit: Array<{ id: string; action: string; targetLabel: string | null; createdAt: string; actor: { name: string | null; email: string } | null }>;
  recentReports: Array<{ id: string; reason: string; priority: string; status: string; createdAt: string; reporter: string }>;
  warnings: string[];
};

const PRESETS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminDashboard() {
  const [preset, setPreset] = useState("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/analytics?preset=${preset}`);
    const payload = await response.json();
    setData(payload);
    setLoading(false);
  }, [preset]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  const maxSignup = Math.max(1, ...data.signupTrend.map((d) => d.count));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Operations dashboard"
        description="Platform health, growth, moderation workload, and revenue at a glance."
        actions={
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  preset === p.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {data.warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-200">Attention needed</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
            {data.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={data.totals.users.toLocaleString()} hint={`+${data.growth.newUsersToday} today`} />
        <StatCard label="New this week" value={data.growth.newUsersWeek.toLocaleString()} hint={`${data.growth.newUsersMonth} this month`} />
        <StatCard label="Creators" value={data.totals.creators.toLocaleString()} hint={`${data.queues.pendingCreators} pending review`} />
        <StatCard label="Published content" value={data.totals.publishedContent.toLocaleString()} hint={`${data.queues.pendingUploads} in queue`} />
        <StatCard label="Active subscriptions" value={data.totals.activeSubscriptions.toLocaleString()} />
        <StatCard label="Revenue (range)" value={formatMoney(data.totals.revenueCents)} />
        <StatCard label="Open reports" value={data.totals.openReports.toLocaleString()} href="/admin/reports" />
        <StatCard label="Ad CTR" value={`${data.totals.adCtr.toFixed(2)}%`} hint={`${data.totals.adImpressions.toLocaleString()} impressions`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <h2 className="text-sm font-semibold">User signups</h2>
          <div className="mt-4 flex h-40 items-end gap-1">
            {data.signupTrend.length ? (
              data.signupTrend.map((point) => (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-accent/80"
                    style={{ height: `${Math.max(4, (point.count / maxSignup) * 100)}%` }}
                    title={`${point.date}: ${point.count}`}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No signup data for this range.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <h2 className="text-sm font-semibold">System</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Creator uploads queued</dt>
              <dd className="font-medium">{data.queues.pendingUploads}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Flagged uploads</dt>
              <dd className="font-medium">{data.queues.flaggedUploads}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Storage (upload metadata)</dt>
              <dd className="font-medium">{formatBytes(data.totals.storageBytes)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <Link href="/admin/audit" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentAudit.length ? (
              data.recentAudit.map((row) => (
                <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                  <span>
                    <span className="font-medium">{row.action}</span>
                    {row.targetLabel ? <span className="text-muted-foreground"> · {row.targetLabel}</span> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">No admin actions logged yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Open reports</h2>
            <Link href="/admin/reports" className="text-xs text-accent hover:underline">
              Reports center
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentReports.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                <span>
                  {row.reason}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{row.priority}</span>
                </span>
                <span className="text-xs text-muted-foreground">{row.reporter}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
