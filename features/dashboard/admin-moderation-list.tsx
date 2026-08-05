"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ModerationItem = {
  id: string;
  reason?: string;
  subject?: string;
  status: string;
  createdAt: string;
  reporter?: { name?: string | null; email?: string | null };
  user?: { name?: string | null; email?: string | null };
  email?: string;
};

type AdminModerationListProps = {
  type: "reports" | "tickets";
  title: string;
};

export function AdminModerationList({ type, title }: AdminModerationListProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);

  async function load() {
    const response = await fetch(`/api/admin/overview?type=${type}`);
    const payload = await response.json();
    setItems(payload.items ?? []);
  }

  useEffect(() => {
    void load();
  }, [type]);

  async function resolve(id: string) {
    await fetch("/api/admin/overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type === "reports" ? "report" : "ticket", id, status: "resolved" }),
    });
    await load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-6 space-y-3">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-surface/60 p-4">
              <p className="text-sm font-medium">{item.reason ?? item.subject ?? "Item"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.reporter?.email ?? item.user?.email ?? item.email ?? "Unknown"} · {item.status}
              </p>
              <Button type="button" size="sm" className="mt-3" onClick={() => resolve(item.id)}>
                Mark resolved
              </Button>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">No open items.</li>
        )}
      </ul>
    </div>
  );
}
