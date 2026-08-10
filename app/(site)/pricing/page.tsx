import type { Metadata } from "next";
import { PricingView } from "@/features/billing/pricing-view";
import { listActivePlans } from "@/services/billing/subscriptions";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Premium membership and creator plans on ${APP_NAME}.`,
};

export default async function PricingPage() {
  let plans: Awaited<ReturnType<typeof listActivePlans>> = [];

  try {
    plans = await listActivePlans();
  } catch {
    plans = [];
  }

  return <PricingView plans={plans} />;
}
