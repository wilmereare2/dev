import crypto from "crypto";

type DynamicCheckoutInput = {
  userId: string;
  email: string;
  amountCents: number;
  returnUrl: string;
  flexformId: string;
  checkoutRef: string;
  recurring: boolean;
};

function formatCcbillPrice(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

function buildDynamicFormDigest(input: {
  account: string;
  salt: string;
  initialPeriod: number;
  recurringPeriod: number;
  initialPrice: string;
  recurringPrice: string;
  numRebills: number;
}) {
  return crypto
    .createHash("md5")
    .update(
      `${input.initialPeriod}${input.recurringPeriod}${input.initialPrice}${input.recurringPrice}${input.numRebills}840${input.account}${input.salt}`,
    )
    .digest("hex");
}

export function buildCcbillDynamicCheckoutUrl(input: DynamicCheckoutInput) {
  const account = process.env.CCBILL_ACCOUNT;
  const subaccount = process.env.CCBILL_SUBACCOUNT;
  const salt = process.env.CCBILL_SALT;

  if (!account || !subaccount || !salt || !input.flexformId) {
    return null;
  }

  const initialPeriod = input.recurring ? 30 : 2;
  const recurringPeriod = input.recurring ? 30 : 2;
  const numRebills = input.recurring ? 99 : 0;
  const price = formatCcbillPrice(input.amountCents);
  const formDigest = buildDynamicFormDigest({
    account,
    salt,
    initialPeriod,
    recurringPeriod,
    initialPrice: price,
    recurringPrice: price,
    numRebills,
  });

  const params = new URLSearchParams({
    clientAccnum: account,
    clientSubacc: subaccount,
    formName: input.flexformId,
    email: input.email,
    customerId: input.userId,
    initialPeriod: String(initialPeriod),
    recurringPeriod: String(recurringPeriod),
    numRebills: String(numRebills),
    initialPrice: price,
    recurringPrice: price,
    currencyCode: "840",
    formDigest,
    successUrl: input.returnUrl,
    failureUrl: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}billing=failed`,
    "X-checkoutRef": input.checkoutRef,
  });

  return `https://bill.ccbill.com/jpost/signup.cgi?${params.toString()}`;
}

export function resolveCreatorFlexformId(kind: "onetime" | "subscription") {
  if (kind === "subscription") {
    return process.env.CCBILL_CREATOR_SUB_FLEXFORM_ID ?? process.env.CCBILL_FLEXFORM_ID ?? null;
  }
  return process.env.CCBILL_CREATOR_ONETIME_FLEXFORM_ID ?? process.env.CCBILL_FLEXFORM_ID ?? null;
}
