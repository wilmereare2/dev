"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/error-state";

type AuditRow = {
  id: string;
  action: string;
  targetLabel: string | null;
  entity: string | null;
  entityId: string | null;
  previousValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
};

const inputClass = "h-10 rounded-xl border border-border bg-background px-3 text-sm";

export function AdminAuditPage() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set("q", q.trim());
    if (action.trim()) params.set("action", action.trim());

    const result = await requestJson<{ items?: AuditRow[]; totalPages?: number }>(
      `/api/admin/audit?${params}`,
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
  }, [action, page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit log" description="Searchable record of administrative actions across the platform." />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <label className="min-w-[180px] flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Search target</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} w-full`} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Action</span>
          <input value={action} onChange={(e) => setAction(e.target.value)} className={inputClass} placeholder="user.ban" />
        </label>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} className="mt-2" />
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/60">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
            ) : items.length ? (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{row.actor?.name ?? row.actor?.email ?? "System"}</td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3">{row.targetLabel ?? row.entityId ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.previousValue && row.newValue ? `${row.previousValue} → ${row.newValue}` : row.newValue ?? row.reason ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">No audit entries found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="self-center text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button type="button" size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
