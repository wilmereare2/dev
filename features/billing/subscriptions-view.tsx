"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  interval: string;
  priceCents: number;
  currency: string;
  trialDays: number;
};

type Subscription = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string | null;
  plan: Plan;
} | null;

type Payment = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string | null;
  createdAt: string;
};

type SubscriptionsViewProps = {
  plans: Plan[];
  subscription: Subscription;
  payments: Payment[];
  devBilling?: boolean;
};

export function SubscriptionsView({ plans, subscription, payments, devBilling }: SubscriptionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setMessage("Subscription activated. Premium content is now unlocked.");
      router.replace("/subscriptions");
    } else if (billing === "failed") {
      setError("Payment was not completed. Try again or use a different method.");
      router.replace("/subscriptions");
    }
  }, [searchParams, router]);

  async function checkout(planSlug: string) {
    setPending(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug }),
    });
    const payload = await response.json().catch(() => ({}));
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Checkout unavailable.");
      return;
    }

    if (payload.devCheckout && payload.redirectUrl) {
      window.location.href = payload.redirectUrl;
      return;
    }

    if (payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }

    setError("Checkout did not return a payment URL.");
  }

  async function cancel() {
    setPending(true);
    const response = await fetch("/api/user/subscriptions", { method: "DELETE" });
    setPending(false);
    setMessage(response.ok ? "Subscription set to cancel at period end." : "Could not cancel subscription.");
  }

  return (
    <div className="space-y-10">
      {devBilling ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Local dev billing is active — Subscribe activates premium instantly without CCBill. Production uses
          CCBill when <code className="text-foreground">CCBILL_*</code> env vars are set.
        </p>
      ) : null}
      {subscription ? (
        <section className="rounded-2xl border border-border bg-surface/60 p-6">
          <h2 className="text-lg font-semibold">Current plan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {subscription.plan.name} · {subscription.status}
            {subscription.cancelAtPeriodEnd ? " · cancels at period end" : ""}
          </p>
          <Button type="button" variant="secondary" className="mt-4" onClick={cancel} disabled={pending}>
            Cancel subscription
          </Button>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-border bg-surface/60 p-6">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            {plan.description ? <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p> : null}
            <p className="mt-4 text-2xl font-bold">
              ${(plan.priceCents / 100).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground"> / {plan.interval}</span>
            </p>
            <Button type="button" className="mt-4" onClick={() => checkout(plan.slug)} disabled={pending}>
              Subscribe
            </Button>
          </article>
        ))}
      </section>

      {payments.length ? (
        <section>
          <h2 className="text-lg font-semibold">Billing history</h2>
          <ul className="mt-4 space-y-3">
            {payments.map((payment) => (
              <li key={payment.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                {payment.description ?? "Payment"} · ${(payment.amountCents / 100).toFixed(2)} · {payment.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </div>
  );
}
