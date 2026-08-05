import { activateSubscription, recordPayment } from "@/services/billing/subscriptions";

export function isDevBillingEnabled() {
  return process.env.NODE_ENV === "development" || process.env.BILLING_DEV_MODE === "true";
}

export async function processDevCheckout(input: {
  userId: string;
  planSlug: string;
  returnUrl: string;
}) {
  const subscription = await activateSubscription({
    userId: input.userId,
    planSlug: input.planSlug,
    providerSubscriptionId: `dev-${Date.now()}`,
  });

  if (!subscription) {
    return { ok: false as const, error: "Subscription plan not found." };
  }

  await recordPayment({
    userId: input.userId,
    amountCents: subscription.plan.priceCents,
    status: "paid",
    providerRef: subscription.providerSubscriptionId ?? undefined,
    description: `${subscription.plan.name} (dev checkout)`,
  });

  const redirectUrl = new URL(input.returnUrl);
  redirectUrl.searchParams.set("billing", "success");

  return {
    ok: true as const,
    devCheckout: true as const,
    subscription,
    redirectUrl: redirectUrl.toString(),
  };
}
