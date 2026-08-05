"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ModerationItem = {
  id: string;
  title: string;
  status: string;
  mediaType: string;
  aiModerationScore?: number | null;
  creator?: { name?: string | null; email: string };
};

export function AdminContentModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/content/moderation");
    const payload = await response.json();
    setItems(payload.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function moderate(id: string, action: "approve" | "reject" | "flag" | "remove") {
    await fetch(`/api/admin/content/${id}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason || undefined }),
    });
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading moderation queue...</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Rejection / moderation notes</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 h-11 w-full max-w-xl rounded-xl border border-border bg-background px-3 text-sm"
          placeholder="Optional reason shown to creator"
        />
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted-foreground">
          No uploads pending review.
        </p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-surface/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.creator?.name ?? item.creator?.email} · {item.mediaType} · {item.status}
                </p>
                {item.aiModerationScore != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI score: {(item.aiModerationScore * 100).toFixed(0)}%
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => moderate(item.id, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => moderate(item.id, "reject")}>
                  Reject
                </Button>
                <Button size="sm" variant="secondary" onClick={() => moderate(item.id, "flag")}>
                  Flag
                </Button>
                <Button size="sm" variant="outline" onClick={() => moderate(item.id, "remove")}>
                  Remove
                </Button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
