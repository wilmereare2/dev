"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModerationItem = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  mediaType: string;
  visibility: string;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  galleryImages?: string[];
  tags?: string[];
  categories?: string[];
  isPremium?: boolean;
  ppvPriceCents?: number | null;
  submittedAt?: string | null;
  aiModerationScore?: number | null;
  creator?: { name?: string | null; email: string };
};

function previewSource(item: ModerationItem) {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.mediaType === "photo" || item.mediaType === "gif" || item.mediaType === "gallery") {
    return item.mediaUrl ?? null;
  }
  return null;
}

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function MediaPreview({ item }: { item: ModerationItem }) {
  const imageSrc = previewSource(item);
  const isVideo = item.mediaType === "video" || item.mediaType === "preview";
  const isAudio = item.mediaType === "audio";
  const isText = item.mediaType === "text";

  if (isText) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/50 p-4 text-sm leading-relaxed">
        {item.description?.trim() || "Text post (no body provided)."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {imageSrc ? (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="" className="max-h-72 w-full object-contain" />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No image preview available for this upload.
        </div>
      )}

      {item.galleryImages && item.galleryImages.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {item.galleryImages.slice(0, 4).map((src, index) => (
            <div key={`${item.id}-gallery-${index}`} className="h-16 w-16 overflow-hidden rounded-lg border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      {item.mediaUrl && !item.mediaUrl.startsWith("data:") ? (
        <a
          href={item.mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <ExternalLink className="size-4" />
          {isVideo ? "Open video URL" : isAudio ? "Open audio URL" : "Open media URL"}
        </a>
      ) : null}

      {item.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      ) : null}
    </div>
  );
}

export function AdminContentModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/content/moderation");
    const payload = (await response.json()) as { items?: ModerationItem[] };
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
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.creator?.name ?? item.creator?.email} · {item.mediaType} · {item.status.replace("_", " ")}
                  {item.submittedAt ? ` · submitted ${formatWhen(item.submittedAt)}` : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-0.5 capitalize">{item.visibility}</span>
                  {item.isPremium ? (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent">
                      Premium
                    </span>
                  ) : null}
                  {item.ppvPriceCents != null && item.ppvPriceCents > 0 ? (
                    <span className="rounded-full border border-border px-2 py-0.5">
                      PPV ${(item.ppvPriceCents / 100).toFixed(2)}
                    </span>
                  ) : null}
                  {item.aiModerationScore != null ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                      AI score: {(item.aiModerationScore * 100).toFixed(0)}%
                    </span>
                  ) : null}
                </div>
                {(item.categories?.length ?? 0) > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Categories: {item.categories?.join(", ")}
                  </p>
                ) : null}
                {(item.tags?.length ?? 0) > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">Tags: {item.tags?.join(", ")}</p>
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

            <div className={cn("mt-4 border-t border-border/60 pt-4")}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Uploaded content preview
              </p>
              <MediaPreview item={item} />
            </div>
          </article>
        ))
      )}
    </div>
  );
}
