import crypto from "crypto";

type CheckoutInput = {
  userId: string;
  email: string;
  planSlug: string;
  returnUrl: string;
};

export function isCcbillConfigured() {
  return Boolean(
    process.env.CCBILL_ACCOUNT &&
      process.env.CCBILL_SUBACCOUNT &&
      process.env.CCBILL_FLEXFORM_ID &&
      process.env.CCBILL_SALT,
  );
}

export function buildCcbillCheckoutUrl(input: CheckoutInput) {
  const account = process.env.CCBILL_ACCOUNT;
  const subaccount = process.env.CCBILL_SUBACCOUNT;
  const flexformId = process.env.CCBILL_FLEXFORM_ID;
  const salt = process.env.CCBILL_SALT;

  if (!account || !subaccount || !flexformId || !salt) {
    return null;
  }

  const initialPeriod = input.planSlug.includes("year") || input.planSlug === "annual" ? 365 : 30;
  const formDigest = crypto
    .createHash("md5")
    .update(`${initialPeriod}${initialPeriod}${account}${salt}`)
    .digest("hex");

  const params = new URLSearchParams({
    clientAccnum: account,
    clientSubacc: subaccount,
    formName: flexformId,
    email: input.email,
    customerId: input.userId,
    initialPeriod: String(initialPeriod),
    recurringPeriod: String(initialPeriod),
    numRebills: "99",
    currencyCode: "840",
    formDigest,
    successUrl: input.returnUrl,
    failureUrl: `${input.returnUrl}?billing=failed`,
  });

  return `https://bill.ccbill.com/jpost/signup.cgi?${params.toString()}`;
}

export function verifyCcbillWebhook(payload: string, signature: string | null) {
  const secret = process.env.CCBILL_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function parseCcbillEvent(body: Record<string, string>) {
  const eventType = body.eventType || body.subscriptionEventType || body.action || "";
  const userId = body.customerId || body["X-customerId"] || "";
  const subscriptionId = body.subscriptionId || body.subscription_id || "";
  const checkoutRef = body["X-checkoutRef"] || body.XcheckoutRef || body.checkoutRef || "";
  const planSlug = body.planSlug || (body.initialPeriod === "365" ? "premium-yearly" : "premium-monthly");

  return { eventType, userId, subscriptionId, checkoutRef, planSlug, raw: body };
}
