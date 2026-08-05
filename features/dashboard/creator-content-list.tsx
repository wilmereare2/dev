"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type UploadItem = {
  id: string;
  title: string;
  status: string;
  visibility: string;
  mediaType: string;
  updatedAt: string;
  ppvPriceCents?: number | null;
  isPremium: boolean;
};

const statusClass: Record<string, string> = {
  draft: "text-muted-foreground",
  pending_review: "text-amber-400",
  approved: "text-blue-400",
  published: "text-green-400",
  rejected: "text-red-400",
  flagged: "text-orange-400",
  removed: "text-red-500",
};

export function CreatorContentList() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/creator/content")
      .then((r) => r.json())
      .then((payload) => setItems(payload.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading content...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/creator-dashboard/content/new">Upload content</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface/60 p-6 text-sm text-muted-foreground">
          No uploads yet. Create your first photo, video, or gallery.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Monetization</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 capitalize">{item.mediaType}</td>
                  <td className={`px-4 py-3 capitalize ${statusClass[item.status] ?? ""}`}>
                    {item.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 capitalize">{item.visibility}</td>
                  <td className="px-4 py-3">
                    {item.ppvPriceCents ? `PPV $${(item.ppvPriceCents / 100).toFixed(2)}` : null}
                    {item.isPremium ? " Premium" : null}
                    {!item.ppvPriceCents && !item.isPremium ? "Free" : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/creator-dashboard/content/${item.id}`} className="text-accent hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
