import { NextResponse } from "next/server";
import { parseCcbillEvent, verifyCcbillWebhook } from "@/services/billing/ccbill";
import { fulfillCreatorCheckout } from "@/services/billing/creator-checkout";
import { activateSubscription, recordPayment } from "@/services/billing/subscriptions";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-ccbill-signature");

  if (!verifyCcbillWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const body = Object.fromEntries(params.entries());
  const event = parseCcbillEvent(body);

  if (!event.userId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const userId = event.userId;
  const eventName = event.eventType.toLowerCase();

  if (event.checkoutRef) {
    if (eventName.includes("new") || eventName.includes("success")) {
      await fulfillCreatorCheckout(event.checkoutRef, event.subscriptionId || undefined);
    }
    return NextResponse.json({ ok: true, creatorCheckout: true });
  }

  if (eventName.includes("new") || eventName.includes("renew") || eventName.includes("success")) {
    await activateSubscription({
      userId,
      planSlug: event.planSlug,
      providerSubscriptionId: event.subscriptionId || undefined,
    });

    const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: event.planSlug } });
    if (plan) {
      await recordPayment({
        userId,
        amountCents: plan.priceCents,
        status: "paid",
        providerRef: event.subscriptionId || undefined,
        description: `${plan.name} subscription`,
      });
    }
  }

  if (eventName.includes("cancel") || eventName.includes("expire")) {
    await prisma.subscription.updateMany({
      where: { userId, status: { in: ["active", "trialing"] } },
      data: { status: "canceled", canceledAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
