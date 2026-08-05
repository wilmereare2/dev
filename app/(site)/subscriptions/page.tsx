import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSession } from "@/lib/auth/guards";
import {
  getUserSubscription,
  listActivePlans,
  listUserPayments,
} from "@/services/billing/subscriptions";
import { SubscriptionsView } from "@/features/billing/subscriptions-view";
import { isDevBillingEnabled } from "@/services/billing/dev-checkout";
import { isCcbillConfigured } from "@/services/billing/ccbill";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your manuelaX premium subscription.",
  robots: { index: false, follow: false },
};

export default async function SubscriptionsPage() {
  const session = await requireSession();
  const [plans, subscription, payments] = await Promise.all([
    listActivePlans(),
    getUserSubscription(session.user.id),
    listUserPayments(session.user.id),
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Subscriptions</h1>
      <p className="mt-2 text-secondary">Upgrade for premium content and billing history.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading subscriptions...</p>}>
          <SubscriptionsView
            devBilling={!isCcbillConfigured() && isDevBillingEnabled()}
            plans={plans}
            subscription={
              subscription
                ? {
                    status: subscription.status,
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                    plan: subscription.plan,
                  }
                : null
            }
            payments={payments.map((payment) => ({
              ...payment,
              createdAt: payment.createdAt.toISOString(),
            }))}
          />
        </Suspense>
      </div>
    </section>
  );
}
