export type MonetizationApiResponse = {
  error?: string;
  checkoutUrl?: string;
  provider?: string;
  devCheckout?: boolean;
  redirectUrl?: string;
  purchase?: unknown;
  subscription?: unknown;
  tip?: unknown;
};

type MonetizationRouter = {
  refresh: () => void;
};

export function applyMonetizationResponse(
  payload: MonetizationApiResponse,
  router: MonetizationRouter,
): { ok: boolean; error?: string } {
  if (payload.checkoutUrl) {
    window.location.assign(payload.checkoutUrl);
    return { ok: true };
  }

  if (payload.devCheckout && payload.redirectUrl) {
    window.location.assign(payload.redirectUrl);
    return { ok: true };
  }

  if (payload.devCheckout || payload.purchase || payload.subscription || payload.tip) {
    router.refresh();
    return { ok: true };
  }

  return { ok: false, error: payload.error ?? "Could not complete payment." };
}
