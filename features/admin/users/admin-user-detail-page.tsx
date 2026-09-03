"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";

const inputClass = "h-10 rounded-xl border border-border bg-background px-3 text-sm w-full";

export function AdminUserDetailPage({ userId }: { userId: string }) {
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Array<{ id: string; body: string; createdAt: string; author: { name: string | null; email: string } }>>([]);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [detailRes, notesRes] = await Promise.all([
      fetch(`/api/admin/users/${userId}`),
      fetch(`/api/admin/users/${userId}/actions`),
    ]);
    setCustomer((await detailRes.json()).customer ?? null);
    setNotes((await notesRes.json()).notes ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: string, extra?: Record<string, string>) {
    if ((action === "suspend" || action === "ban") && !reason.trim()) {
      setMessage("Reason is required.");
      return;
    }
    if (!window.confirm(`Confirm: ${action.replace("_", " ")}?`)) return;

    const response = await fetch(`/api/admin/users/${userId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason, ...extra }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Action failed.");
      return;
    }
    setMessage("Action completed.");
    setReason("");
    void load();
  }

  if (loading || !customer) {
    return <p className="text-sm text-muted-foreground">Loading user…</p>;
  }

  const user = customer as {
    id: string;
    name: string | null;
    email: string;
    role: string;
    accountStatus?: string;
    createdAt: string;
    subscriptions?: unknown[];
    payments?: unknown[];
    reports?: unknown[];
    reportsAgainst?: unknown[];
    _count?: Record<string, number>;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name ?? user.email}
        description={`${user.email} · ${user.role} · ${user.accountStatus ?? "active"}`}
        actions={<Link href="/admin/users" className="text-sm text-accent hover:underline">← All users</Link>}
      />

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-semibold">Account actions</h2>
          <label className="mt-3 block text-sm">
            <span className="text-muted-foreground">Reason (suspend/ban)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void runAction("suspend")}>Suspend</Button>
            <Button size="sm" variant="secondary" onClick={() => void runAction("unsuspend")}>Unsuspend</Button>
            <Button size="sm" variant="secondary" onClick={() => void runAction("ban")}>Ban</Button>
            <Button size="sm" variant="secondary" onClick={() => void runAction("restore")}>Restore</Button>
            <Button size="sm" variant="secondary" onClick={() => void runAction("revoke_sessions")}>Force logout</Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-semibold">Internal notes</h2>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-[80px] w-full rounded-xl border border-border bg-background p-3 text-sm" />
          <Button size="sm" className="mt-2" onClick={() => void runAction("add_note", { note })}>Add note</Button>
          <ul className="mt-4 space-y-2 text-sm">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-muted/30 p-3">
                <p>{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.author.name ?? n.author.email} · {new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-border p-5 text-sm">
        <h2 className="font-semibold">Activity summary</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {user._count ? Object.entries(user._count).map(([key, val]) => (
            <div key={key}><dt className="text-muted-foreground capitalize">{key}</dt><dd className="font-medium">{val}</dd></div>
          )) : null}
        </dl>
      </section>
    </div>
  );
}
