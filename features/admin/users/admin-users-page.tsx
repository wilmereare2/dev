"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-accent/60";

type CustomerRow = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  accountStatus?: string;
  createdAt: string;
  subscriptionStatus?: string | null;
  isCreator: boolean;
};

export function AdminUsersPage() {
  const [items, setItems] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (query.trim()) params.set("q", query.trim());
    if (role !== "all") params.set("role", role);
    if (accountStatus !== "all") params.set("accountStatus", accountStatus);
    const response = await fetch(`/api/admin/users?${params}`);
    const payload = await response.json();
    setItems(payload.customers ?? []);
    setTotalPages(payload.totalPages ?? 1);
    setLoading(false);
  }, [page, query, role, accountStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="User management" description="Search, review, suspend, ban, and manage platform accounts." />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} w-full`} placeholder="Name or email" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            <option value="all">All</option>
            <option value="USER">User</option>
            <option value="CREATOR">Creator</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} className={inputClass}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </label>
        <Button type="submit" size="sm">Search</Button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/60">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
            ) : items.length ? (
              items.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3 capitalize">{row.accountStatus ?? "active"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${row.id}`} className="text-accent hover:underline">View</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">No users found.</td></tr>
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
