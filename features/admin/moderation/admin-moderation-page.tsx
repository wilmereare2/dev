"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";

type QueueData = {
  uploads: Array<{ id: string; title: string; status: string; mediaType: string; creator?: { name: string | null; email: string } }>;
  reports: Array<{ id: string; reason: string; priority: string; status: string; reporter?: { name: string | null; email: string } }>;
  comments: Array<{ id: string; body: string; user?: { name: string | null; email: string } }>;
};

export function AdminModerationPage() {
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/moderation/queue");
    setQueue(await response.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !queue) {
    return <p className="text-sm text-muted-foreground">Loading moderation queue…</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Moderation queue"
        description="Review pending uploads, open reports, and unapproved comments in one place."
        actions={
          <Link href="/admin/content" className="text-sm text-accent hover:underline">
            Full content moderation →
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Pending uploads ({queue.uploads.length})</h2>
        {queue.uploads.length ? (
          <ul className="space-y-2">
            {queue.uploads.slice(0, 10).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-4 text-sm">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.creator?.email ?? "Unknown creator"} · {item.mediaType} · {item.status}</p>
                </div>
                <Link href="/admin/content" className="text-accent hover:underline">Review</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Queue clear.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Open reports ({queue.reports.length})</h2>
        {queue.reports.length ? (
          <ul className="space-y-2">
            {queue.reports.slice(0, 8).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-4 text-sm">
                <div>
                  <p className="font-medium">{item.reason}</p>
                  <p className="text-xs text-muted-foreground">{item.reporter?.email ?? "Anonymous"} · {item.priority}</p>
                </div>
                <Link href="/admin/reports" className="text-accent hover:underline">Open</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No open reports.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Comments awaiting approval ({queue.comments.length})</h2>
        {queue.comments.length ? (
          <ul className="space-y-2">
            {queue.comments.slice(0, 8).map((item) => (
              <li key={item.id} className="rounded-xl border border-border p-4 text-sm">
                <p>{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.user?.email ?? "Unknown"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pending comments.</p>
        )}
        {queue.comments.length ? (
          <Link href="/admin/comments" className="inline-block text-sm text-accent hover:underline">Moderate all comments →</Link>
        ) : null}
      </section>

      <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>Refresh queue</Button>
    </div>
  );
}
