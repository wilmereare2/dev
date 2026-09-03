"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";

type CommentRow = {
  id: string;
  body: string;
  contentId: string;
  createdAt: string;
  user?: { name: string | null; email: string };
};

export function AdminCommentsPage() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/platform?section=comments&page=${page}`);
    const payload = await response.json();
    setItems(payload.items ?? []);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(commentId: string, action: "approve" | "remove") {
    if (action === "remove" && !window.confirm("Remove this comment permanently?")) return;
    await fetch("/api/admin/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "comments", commentId, action }),
    });
    void load();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Comments" description="Approve or remove user comments awaiting moderation." />

      <ul className="space-y-3">
        {loading ? (
          <li className="text-sm text-muted-foreground">Loading…</li>
        ) : items.length ? (
          items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border p-4">
              <p className="text-sm">{item.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.user?.email ?? "Unknown"} · {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void moderate(item.id, "approve")}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => void moderate(item.id, "remove")}>Remove</Button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">No comments pending approval.</li>
        )}
      </ul>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
