"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, MessageSquare, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export function NavActions() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/user/notifications");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          items?: NotificationItem[];
          unreadCount?: number;
        };
        if (cancelled) return;
        setItems(payload.items ?? []);
        setUnreadCount(payload.unreadCount ?? 0);
      } catch {
        /* ignore */
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setUnreadCount(0);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
  }

  if (!session?.user) return null;

  const canUpload = ["CREATOR", "ADMIN", "EDITOR", "BUSINESS", "MODERATOR"].includes(
    session.user.role ?? "USER",
  );

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <div ref={rootRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-background" />
          ) : null}
        </Button>

        {open ? (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.length ? (
                items.map((item) => (
                  <li key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "block px-4 py-3 transition hover:bg-muted",
                          !item.readAt ? "bg-accent/5" : "",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                      </Link>
                    ) : (
                      <div className={cn("px-4 py-3", !item.readAt ? "bg-accent/5" : "")}>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                      </div>
                    )}
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </li>
              )}
            </ul>
          </div>
        ) : null}
      </div>

      <Button asChild variant="ghost" size="icon" aria-label="Messages">
        <Link href="/messages">
          <MessageSquare className="size-4" />
        </Link>
      </Button>

      {canUpload ? (
        <Button asChild size="sm" variant="secondary" className="hidden md:inline-flex">
          <Link href="/create/upload">
            <Upload className="size-4" />
            Upload
          </Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="secondary" className="hidden md:inline-flex">
          <Link href="/create">
            <Upload className="size-4" />
            Create
          </Link>
        </Button>
      )}
    </div>
  );
}
