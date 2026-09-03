"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type ComplianceData = {
  ageVerified: number;
  pendingCreators: number;
  openComplianceReports: number;
  recentTerms: Array<{
    id: string;
    termsVersion: string;
    privacyVersion: string;
    acceptedAt: string;
    user: { id: string; name: string | null; email: string };
  }>;
};

export function AdminCompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/platform?section=compliance");
    setData(await response.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading compliance overview…</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Compliance"
        description="Age verification, creator verification, takedowns, and audit records. Identity documents are not stored in the application database."
      />

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        This module structures compliance workflows for auditability. Legal compliance depends on your jurisdiction, policies, and operational procedures — not software alone.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Age-verified users</p>
          <p className="mt-1 text-2xl font-semibold">{data.ageVerified.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Pending creator verification</p>
          <p className="mt-1 text-2xl font-semibold">{data.pendingCreators}</p>
          <Link href="/admin/creators" className="mt-2 inline-block text-xs text-accent hover:underline">Review creators</Link>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Open compliance reports</p>
          <p className="mt-1 text-2xl font-semibold">{data.openComplianceReports}</p>
          <Link href="/admin/reports" className="mt-2 inline-block text-xs text-accent hover:underline">Reports center</Link>
        </div>
      </div>

      <section className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold">Recent terms acceptances</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {data.recentTerms.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-border/40 py-2 last:border-0">
              <span>{row.user.name ?? row.user.email}</span>
              <span className="text-xs text-muted-foreground">
                Terms {row.termsVersion} · Privacy {row.privacyVersion} · {new Date(row.acceptedAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
