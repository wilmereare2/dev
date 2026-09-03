"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, MoreHorizontal } from "lucide-react";
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

type ModerationAction = "approve" | "reject" | "flag" | "remove";

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

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function ModerationMeta({ item }: { item: ModerationItem }) {
  const badges: { key: string; label: string; className?: string }[] = [
    { key: "visibility", label: item.visibility, className: "capitalize" },
  ];

  if (item.isPremium) {
    badges.push({
      key: "premium",
      label: "Premium",
      className: "border-accent/30 bg-accent/10 text-accent",
    });
  }

  if (item.ppvPriceCents != null && item.ppvPriceCents > 0) {
    badges.push({
      key: "ppv",
      label: `PPV $${(item.ppvPriceCents / 100).toFixed(2)}`,
    });
  }

  if (item.aiModerationScore != null) {
    badges.push({
      key: "ai",
      label: `AI ${(item.aiModerationScore * 100).toFixed(0)}%`,
      className: "text-muted-foreground",
    });
  }

  const categoryLabel =
    (item.categories?.length ?? 0) > 0 ? item.categories!.join(", ") : null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{item.creator?.name ?? item.creator?.email}</span>
        <span aria-hidden>·</span>
        <span className="capitalize">{item.mediaType}</span>
        <span aria-hidden>·</span>
        <span className="capitalize">{formatStatus(item.status)}</span>
        {item.submittedAt ? (
          <>
            <span aria-hidden>·</span>
            <span>{formatWhen(item.submittedAt)}</span>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {badges.map((badge) => (
          <span
            key={badge.key}
            className={cn(
              "rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] font-medium",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        ))}
        {categoryLabel ? (
          <span className="text-[11px] text-muted-foreground">{categoryLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

function ThumbnailPreview({ item }: { item: ModerationItem }) {
  const imageSrc = previewSource(item);
  const isText = item.mediaType === "text";
  const galleryCount = item.galleryImages?.length ?? 0;

  if (isText) {
    return (
      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/50 p-2 text-center text-[10px] leading-snug text-muted-foreground">
        Text post
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/30 px-2 text-center text-[10px] text-muted-foreground">
        No preview
      </div>
    );
  }

  return (
    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      {galleryCount > 1 ? (
        <span className="absolute bottom-1 right-1 rounded bg-background/90 px-1 py-0.5 text-[10px] font-medium">
          +{galleryCount - 1}
        </span>
      ) : null}
    </div>
  );
}

function ModerationActions({
  onAction,
  pending,
}: {
  onAction: (action: ModerationAction) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const secondaryActions: { action: ModerationAction; label: string; destructive?: boolean }[] = [
    { action: "reject", label: "Reject" },
    { action: "flag", label: "Flag" },
    { action: "remove", label: "Remove", destructive: true },
  ];

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button size="sm" disabled={pending} onClick={() => onAction("approve")}>
        Approve
      </Button>
      <div ref={rootRef} className="relative">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More moderation actions"
          className="px-2"
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="size-4" />
        </Button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[8.5rem] rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
            {secondaryActions.map(({ action, label, destructive }) => (
              <button
                key={action}
                type="button"
                role="menuitem"
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm transition hover:bg-muted/60",
                  destructive ? "text-red-400" : "text-foreground",
                )}
                onClick={() => {
                  setOpen(false);
                  onAction(action);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModerationRow({
  item,
  onModerate,
  pendingId,
}: {
  item: ModerationItem;
  onModerate: (id: string, action: ModerationAction) => Promise<void>;
  pendingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const pending = pendingId === item.id;
  const isText = item.mediaType === "text";
  const hasMediaLink = item.mediaUrl && !item.mediaUrl.startsWith("data:");

  return (
    <article className="rounded-xl border border-border/70 bg-surface/50 p-3 sm:p-3.5">
      <div className="flex gap-3">
        <button
          type="button"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse preview" : "Expand preview"}
        >
          <ThumbnailPreview item={item} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold sm:text-base">{item.title}</h3>
              <ModerationMeta item={item} />
              {item.description && !expanded ? (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              {(item.tags?.length ?? 0) > 0 ? (
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  Tags: {item.tags!.join(", ")}
                </p>
              ) : null}
            </div>

            <ModerationActions
              pending={pending}
              onAction={(action) => void onModerate(item.id, action)}
            />
          </div>

          {expanded ? (
            <div className="mt-3 border-t border-border/50 pt-3">
              {isText ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description?.trim() || "Text post (no body provided)."}
                </p>
              ) : previewSource(item) ? (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-background/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSource(item)!}
                    alt=""
                    className="max-h-40 w-full object-contain"
                  />
                </div>
              ) : null}

              {item.galleryImages && item.galleryImages.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.galleryImages.slice(0, 6).map((src, index) => (
                    <div
                      key={`${item.id}-gallery-${index}`}
                      className="h-12 w-12 overflow-hidden rounded-md border border-border/60"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}

              {item.description && !isText ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              ) : null}

              {hasMediaLink ? (
                <a
                  href={item.mediaUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Open full media
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AdminContentModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  async function moderate(id: string, action: ModerationAction) {
    setPendingId(id);
    try {
      await fetch(`/api/admin/content/${id}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      await load();
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading moderation queue...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="moderation-notes" className="text-xs font-medium text-muted-foreground">
            Rejection / moderation notes
          </label>
          <input
            id="moderation-notes"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 h-9 w-full max-w-lg rounded-lg border border-border bg-background px-3 text-sm"
            placeholder="Optional reason shown to creator"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} pending
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground">
          No uploads pending review.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ModerationRow
              key={item.id}
              item={item}
              pendingId={pendingId}
              onModerate={moderate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
