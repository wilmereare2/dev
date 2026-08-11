import { isCcbillCreatorCheckoutConfigured } from "@/services/billing/creator-checkout";
import { isDevBillingEnabled } from "@/services/billing/dev-checkout";

export function isCreatorMonetizationEnabled() {
  return isDevBillingEnabled() || isCcbillCreatorCheckoutConfigured();
}

export const CREATOR_MONETIZATION_UNAVAILABLE =
  "Creator payments are not available yet. Configure CCBill creator flex forms or enable BILLING_DEV_MODE for local testing.";
