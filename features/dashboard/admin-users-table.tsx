"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-accent/60";

type CustomerRow = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  createdAt: string;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  openTickets: number;
  isCreator: boolean;
  creatorVerificationStatus?: string | null;
  suspendedAt?: string | null;
};

type SearchResult = {
  customers: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const ROLES = ["all", "USER", "CREATOR", "MODERATOR", "ADMIN", "EDITOR", "BUSINESS"];

function statusBadge(status: string | null | undefined) {
  if (!status) return "—";
  if (status === "active" || status === "trialing") {
    return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">{status}</span>;
  }
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{status}</span>;
}

export function AdminUsersTable() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "25",
    });
    if (query.trim()) params.set("q", query.trim());
    if (role !== "all") params.set("role", role);

    const response = await fetch(`/api/admin/users?${params.toString()}`);
    const payload = await response.json();
    setResult(payload);
    setLoading(false);
  }, [page, query, role]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Customer management</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, review, and manage registered customers, subscriptions, and support history.
        </p>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            className={`${inputClass} w-full`}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All roles" : item}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customers...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface/60">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Tickets</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(result?.customers ?? []).map((customer) => (
                  <tr key={customer.id} className="border-b border-border/60">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{customer.name ?? "—"}</p>
                        <p className="text-muted-foreground">{customer.email}</p>
                        {customer.suspendedAt ? (
                          <p className="mt-1 text-xs text-red-400">Suspended creator</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{customer.role}</span>
                      {customer.isCreator ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Creator · {customer.creatorVerificationStatus ?? "—"}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(customer.subscriptionStatus)}
                      {customer.subscriptionPlan ? (
                        <p className="mt-1 text-xs text-muted-foreground">{customer.subscriptionPlan}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {customer.openTickets > 0 ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                          {customer.openTickets} open
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${customer.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        View profile
                      </Link>
                    </td>
                  </tr>
                ))}
                {!result?.customers?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No customers found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {result && result.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                {result.total} customer{result.total === 1 ? "" : "s"} · page {result.page} of{" "}
                {result.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= result.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
