"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/error-state";

type ReportRow = {
  id: string;
  reason: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  reporter?: { name: string | null; email: string };
};

const inputClass = "h-10 rounded-xl border border-border bg-background px-3 text-sm";

export function AdminReportsPage() {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: "25", status });
    if (priority !== "all") params.set("priority", priority);
    if (q.trim()) params.set("q", q.trim());

    const result = await requestJson<{ items?: ReportRow[]; totalPages?: number }>(
      `/api/admin/reports?${params}`,
    );
    if (!result.ok) {
      setItems([]);
      setError(result.error);
      setLoading(false);
      return;
    }
    setItems(result.data.items ?? []);
    setTotalPages(result.data.totalPages ?? 1);
    setLoading(false);
  }, [page, priority, q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateReport(id: string, patch: Record<string, string>) {
    if (patch.status === "resolved" && !window.confirm("Resolve this report?")) return;
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...patch, note }),
    });
    setNote("");
    setSelected(null);
    void load();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reports center" description="Assign, prioritize, and resolve user and content reports." />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <label className="min-w-[180px] flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} w-full`} placeholder="Reason or details" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} className="mt-2" />
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/60">
            <tr>
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
            ) : items.length ? (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.category}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">{row.priority}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-xs">{row.reporter?.name ?? row.reporter?.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-accent hover:underline" onClick={() => setSelected(row)}>Manage</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">No reports match filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-border p-5">
          <h3 className="font-semibold">Manage report</h3>
          <p className="mt-1 text-sm text-muted-foreground">{selected.reason}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)"
            className="mt-3 min-h-[72px] w-full rounded-xl border border-border bg-background p-3 text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void updateReport(selected.id, { status: "investigating" })}>Investigate</Button>
            <Button size="sm" variant="secondary" onClick={() => void updateReport(selected.id, { priority: "high" })}>Escalate</Button>
            <Button size="sm" onClick={() => void updateReport(selected.id, { status: "resolved" })}>Resolve</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="self-center text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button type="button" size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
