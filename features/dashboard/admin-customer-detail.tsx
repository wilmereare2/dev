"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:border-accent/60";

const ROLES = ["USER", "CREATOR", "MODERATOR", "ADMIN", "EDITOR", "BUSINESS", "VIEWER"];

type CustomerDetail = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  settings: {
    bio: string | null;
    locale: string;
    dateOfBirth: string | null;
    ageVerifiedAt: string | null;
    ageVerificationMethod: string | null;
    emailNotifications: boolean;
    marketingEmails: boolean;
  } | null;
  twoFactor: { enabled: boolean } | null;
  termsAccepted: Array<{
    termsVersion: string;
    privacyVersion: string;
    acceptedAt: string;
    ipAddress: string | null;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: { name: string; priceCents: number; interval: string };
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    description: string | null;
    createdAt: string;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    createdAt: string;
  }>;
  creatorProfile: {
    displayName: string | null;
    verificationStatus: string;
    suspendedAt: string | null;
    suspensionReason: string | null;
    subscriptionPriceCents: number | null;
  } | null;
  creatorSubscriptionsAsSubscriber: Array<{
    id: string;
    status: string;
    priceCents: number;
    creator: { id: string; name: string | null; email: string };
  }>;
  contentPurchases: Array<{
    id: string;
    amountCents: number;
    type: string;
    createdAt: string;
    upload: { id: string; title: string; status: string } | null;
  }>;
  tipsSent: Array<{
    id: string;
    amountCents: number;
    message: string | null;
    createdAt: string;
    toCreator: { id: string; name: string | null; email: string };
  }>;
  tipsReceived: Array<{
    id: string;
    amountCents: number;
    message: string | null;
    createdAt: string;
    fromUser: { id: string; name: string | null; email: string };
  }>;
  reports: Array<{ id: string; reason: string; status: string; createdAt: string }>;
  reportsAgainst: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    reporter: { id: string; name: string | null; email: string };
  }>;
  _count: {
    bookmarks: number;
    watchHistory: number;
    creatorFollows: number;
    contentLikes: number;
    creatorUploads: number;
    blockedUsers: number;
    blockedBy: number;
  };
};

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-5">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function AdminCustomerDetail({ userId }: { userId: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/admin/users/${userId}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load customer.");
      setCustomer(null);
    } else {
      setCustomer(payload.customer);
      setRole(payload.customer.role);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function saveChanges(input: { role?: string; suspend?: boolean }) {
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        role: input.role ?? role,
        suspensionReason: suspensionReason || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Update failed.");
    } else {
      setCustomer(payload.customer);
      setRole(payload.customer.role);
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading customer profile...</p>;
  }

  if (!customer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{error ?? "Customer not found."}</p>
        <Link href="/admin/users" className="text-sm text-accent hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  const activeSubscription = customer.subscriptions.find((item) =>
    ["active", "trialing"].includes(item.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-sm text-accent hover:underline">
            ← Back to customers
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{customer.name ?? customer.email}</h2>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3 text-sm">
          <p className="text-muted-foreground">Customer ID</p>
          <p className="font-mono text-xs">{customer.id}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Account">
          <InfoRow label="Role" value={customer.role} />
          <InfoRow label="Email verified" value={customer.emailVerified ? "Yes" : "No"} />
          <InfoRow label="2FA enabled" value={customer.twoFactor?.enabled ? "Yes" : "No"} />
          <InfoRow label="Joined" value={formatDate(customer.createdAt)} />
          <InfoRow label="Last updated" value={formatDate(customer.updatedAt)} />
          <InfoRow label="Locale" value={customer.settings?.locale ?? "en"} />
          <InfoRow label="Age verified" value={formatDate(customer.settings?.ageVerifiedAt)} />
        </Section>

        <Section title="Engagement">
          <InfoRow label="Bookmarks" value={customer._count.bookmarks} />
          <InfoRow label="Watch history" value={customer._count.watchHistory} />
          <InfoRow label="Creator follows" value={customer._count.creatorFollows} />
          <InfoRow label="Likes" value={customer._count.contentLikes} />
          <InfoRow label="Uploads" value={customer._count.creatorUploads} />
          <InfoRow label="Blocked users" value={customer._count.blockedUsers} />
          <InfoRow label="Blocked by" value={customer._count.blockedBy} />
        </Section>

        <Section title="Platform subscription">
          {activeSubscription ? (
            <>
              <InfoRow label="Plan" value={activeSubscription.plan.name} />
              <InfoRow
                label="Price"
                value={`${money(activeSubscription.plan.priceCents)} / ${activeSubscription.plan.interval}`}
              />
              <InfoRow label="Status" value={activeSubscription.status} />
              <InfoRow label="Period end" value={formatDate(activeSubscription.currentPeriodEnd)} />
              <InfoRow
                label="Cancel at period end"
                value={activeSubscription.cancelAtPeriodEnd ? "Yes" : "No"}
              />
            </>
          ) : (
            <p className="text-muted-foreground">No active platform subscription.</p>
          )}
        </Section>

        <Section title="Compliance">
          {customer.termsAccepted[0] ? (
            <>
              <InfoRow label="Terms version" value={customer.termsAccepted[0].termsVersion} />
              <InfoRow label="Privacy version" value={customer.termsAccepted[0].privacyVersion} />
              <InfoRow label="Accepted at" value={formatDate(customer.termsAccepted[0].acceptedAt)} />
              <InfoRow label="IP address" value={customer.termsAccepted[0].ipAddress ?? "—"} />
            </>
          ) : (
            <p className="text-muted-foreground">No terms acceptance on record.</p>
          )}
        </Section>
      </div>

      {customer.creatorProfile ? (
        <Section title="Creator profile">
          <InfoRow label="Display name" value={customer.creatorProfile.displayName ?? "—"} />
          <InfoRow label="Verification" value={customer.creatorProfile.verificationStatus} />
          <InfoRow
            label="Subscription price"
            value={
              customer.creatorProfile.subscriptionPriceCents
                ? money(customer.creatorProfile.subscriptionPriceCents)
                : "—"
            }
          />
          <InfoRow label="Suspended" value={customer.creatorProfile.suspendedAt ? "Yes" : "No"} />
          {customer.creatorProfile.suspendedAt ? (
            <InfoRow label="Suspension reason" value={customer.creatorProfile.suspensionReason ?? "—"} />
          ) : null}
        </Section>
      ) : null}

      <Section title="Recent payments">
        {customer.payments.length ? (
          customer.payments.map((payment) => (
            <InfoRow
              key={payment.id}
              label={formatDate(payment.createdAt)}
              value={`${money(payment.amountCents, payment.currency)} · ${payment.status}${payment.description ? ` · ${payment.description}` : ""}`}
            />
          ))
        ) : (
          <p className="text-muted-foreground">No payments recorded.</p>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Creator subscriptions">
          {customer.creatorSubscriptionsAsSubscriber.length ? (
            customer.creatorSubscriptionsAsSubscriber.map((sub) => (
              <InfoRow
                key={sub.id}
                label={sub.creator.name ?? sub.creator.email}
                value={`${money(sub.priceCents)} · ${sub.status}`}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No creator subscriptions.</p>
          )}
        </Section>

        <Section title="Content purchases">
          {customer.contentPurchases.length ? (
            customer.contentPurchases.map((purchase) => (
              <InfoRow
                key={purchase.id}
                label={purchase.upload?.title ?? purchase.type}
                value={`${money(purchase.amountCents)} · ${formatDate(purchase.createdAt)}`}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No purchases.</p>
          )}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Support tickets">
          {customer.tickets.length ? (
            customer.tickets.map((ticket) => (
              <InfoRow
                key={ticket.id}
                label={ticket.subject}
                value={`${ticket.status} · ${formatDate(ticket.createdAt)}`}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No support tickets.</p>
          )}
        </Section>

        <Section title="Reports">
          {customer.reports.length || customer.reportsAgainst.length ? (
            <>
              {customer.reports.map((report) => (
                <InfoRow
                  key={`filed-${report.id}`}
                  label={`Filed: ${report.reason}`}
                  value={`${report.status} · ${formatDate(report.createdAt)}`}
                />
              ))}
              {customer.reportsAgainst.map((report) => (
                <InfoRow
                  key={`against-${report.id}`}
                  label={`Against user: ${report.reason}`}
                  value={`${report.status} · by ${report.reporter.email}`}
                />
              ))}
            </>
          ) : (
            <p className="text-muted-foreground">No reports linked to this customer.</p>
          )}
        </Section>
      </div>

      <Section title="Admin actions">
        <label className="block text-sm">
          <span className="text-muted-foreground">Change role (admin only)</span>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" disabled={saving} onClick={() => saveChanges({ role })}>
            Save role
          </Button>
        </div>

        {customer.creatorProfile ? (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <label className="block text-sm">
              <span className="text-muted-foreground">Suspension reason (creators only)</span>
              <input
                value={suspensionReason}
                onChange={(event) => setSuspensionReason(event.target.value)}
                placeholder="Policy violation"
                className={inputClass}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {customer.creatorProfile.suspendedAt ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => saveChanges({ suspend: false })}
                >
                  Unsuspend creator
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => saveChanges({ suspend: true })}
                >
                  Suspend creator
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  );
}
