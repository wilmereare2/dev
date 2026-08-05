import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import {
  cancelSubscription,
  getUserSubscription,
  listActivePlans,
  listUserPayments,
} from "@/services/billing/subscriptions";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const [plans, subscription, payments] = await Promise.all([
    listActivePlans(),
    getUserSubscription(authResult.userId),
    listUserPayments(authResult.userId),
  ]);

  return NextResponse.json({ plans, subscription, payments });
}

export async function DELETE() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const subscription = await cancelSubscription(authResult.userId);
  if (!subscription) {
    return NextResponse.json({ error: "No active subscription." }, { status: 404 });
  }

  return NextResponse.json({ subscription });
}
