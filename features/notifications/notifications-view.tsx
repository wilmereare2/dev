"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NotificationsView() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/user/notifications?limit=50");
      if (!response.ok) return;
      const payload = (await response.json()) as {
        items?: NotificationItem[];
        unreadCount?: number;
      };
      setItems(payload.items ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function markAllRead() {
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnreadCount(0);
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
  }

  async function markRead(item: NotificationItem) {
    if (item.readAt) return;
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: item.id }),
    });
    setUnreadCount((count) => Math.max(0, count - 1));
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry,
      ),
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Notifications
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Activity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Messages, approvals, and account updates in one place.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/40">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Loading notifications…
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : null}

        {!loading && items.length > 0 ? (
          <ul>
            {items.map((item) => {
              const content = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <time className="shrink-0 text-xs text-muted-foreground">{formatWhen(item.createdAt)}</time>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                </>
              );

              return (
                <li key={item.id} className="border-b border-border/60 last:border-b-0">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => void markRead(item)}
                      className={cn(
                        "block px-4 py-4 transition hover:bg-muted/30",
                        !item.readAt && "bg-accent/5",
                      )}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={cn("px-4 py-4", !item.readAt && "bg-accent/5")}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
