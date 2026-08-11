import { prisma } from "@/lib/db/prisma";
import { isCcbillConfigured } from "@/services/billing/ccbill";
import {
  buildCcbillDynamicCheckoutUrl,
  resolveCreatorFlexformId,
} from "@/services/billing/ccbill-creator-forms";
import { isDevBillingEnabled } from "@/services/billing/dev-checkout";
import {
  grantCreatorSubscription,
  grantPpvPurchase,
  grantTip,
} from "@/services/creator/monetization";

export type CreatorCheckoutIntent =
  | { type: "ppv"; uploadId: string; amountCents: number; title: string }
  | { type: "subscribe"; creatorUserId: string; amountCents: number }
  | { type: "tip"; creatorUserId: string; amountCents: number; message?: string };

export function isCcbillCreatorCheckoutConfigured() {
  if (!isCcbillConfigured()) return false;
  return Boolean(resolveCreatorFlexformId("onetime") && resolveCreatorFlexformId("subscription"));
}

export function serializeCreatorCheckoutIntent(intent: CreatorCheckoutIntent) {
  return JSON.stringify(intent);
}

export function parseCreatorCheckoutIntent(description: string | null | undefined): CreatorCheckoutIntent | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description) as CreatorCheckoutIntent;
    if (parsed.type === "ppv" && parsed.uploadId && parsed.amountCents > 0) return parsed;
    if (parsed.type === "subscribe" && parsed.creatorUserId && parsed.amountCents > 0) return parsed;
    if (parsed.type === "tip" && parsed.creatorUserId && parsed.amountCents >= 100) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function createPendingCheckout(userId: string, intent: CreatorCheckoutIntent) {
  return prisma.paymentRecord.create({
    data: {
      userId,
      amountCents: intent.amountCents,
      status: "pending",
      provider: "ccbill",
      description: serializeCreatorCheckoutIntent(intent),
    },
  });
}

function defaultReturnUrl(origin: string, intent: CreatorCheckoutIntent, returnPath?: string) {
  if (returnPath) {
    const url = new URL(returnPath, origin);
    url.searchParams.set("billing", "success");
    return url.toString();
  }

  if (intent.type === "ppv") {
    return `${origin}/posts/${intent.uploadId}?billing=success`;
  }

  return `${origin}/promotions?billing=success`;
}

async function resolvePpvIntent(userId: string, uploadId: string) {
  const upload = await prisma.creatorUpload.findUnique({ where: { id: uploadId } });
  if (!upload?.ppvPriceCents || upload.ppvPriceCents <= 0) {
    return { ok: false as const, error: "This content is not pay-per-view." };
  }

  const existing = await prisma.contentPurchase.findFirst({ where: { userId, uploadId } });
  if (existing) {
    return { ok: false as const, error: "You already purchased this content." };
  }

  return {
    ok: true as const,
    intent: {
      type: "ppv" as const,
      uploadId,
      amountCents: upload.ppvPriceCents,
      title: upload.title,
    },
  };
}

async function resolveSubscribeIntent(subscriberId: string, creatorUserId: string) {
  if (subscriberId === creatorUserId) {
    return { ok: false as const, error: "You cannot subscribe to yourself." };
  }

  const profile = await prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
  if (!profile) {
    return { ok: false as const, error: "Creator not found." };
  }

  return {
    ok: true as const,
    intent: {
      type: "subscribe" as const,
      creatorUserId,
      amountCents: profile.subscriptionPriceCents ?? 999,
    },
  };
}

async function resolveTipIntent(fromUserId: string, creatorUserId: string, amountCents: number, message?: string) {
  if (amountCents < 100) {
    return { ok: false as const, error: "Minimum tip is $1.00." };
  }

  if (fromUserId === creatorUserId) {
    return { ok: false as const, error: "You cannot tip yourself." };
  }

  const creator = await prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
  if (!creator) {
    return { ok: false as const, error: "Creator not found." };
  }

  return {
    ok: true as const,
    intent: {
      type: "tip" as const,
      creatorUserId,
      amountCents,
      message: message?.trim() || undefined,
    },
  };
}

export async function startCreatorCheckout(input: {
  userId: string;
  email: string;
  origin: string;
  action: "purchase" | "subscribe" | "tip";
  uploadId?: string;
  creatorUserId?: string;
  amountCents?: number;
  message?: string;
  returnPath?: string;
}) {
  let resolved:
    | { ok: true; intent: CreatorCheckoutIntent }
    | { ok: false; error: string };

  if (input.action === "purchase") {
    if (!input.uploadId) return { ok: false as const, error: "Invalid purchase." };
    resolved = await resolvePpvIntent(input.userId, input.uploadId);
  } else if (input.action === "subscribe") {
    if (!input.creatorUserId) return { ok: false as const, error: "Invalid subscription." };
    resolved = await resolveSubscribeIntent(input.userId, input.creatorUserId);
  } else {
    if (!input.creatorUserId || !input.amountCents) return { ok: false as const, error: "Invalid tip." };
    resolved = await resolveTipIntent(input.userId, input.creatorUserId, input.amountCents, input.message);
  }

  if (!resolved.ok) return resolved;

  const returnUrl = defaultReturnUrl(input.origin, resolved.intent, input.returnPath);

  if (isDevBillingEnabled()) {
    if (resolved.intent.type === "ppv") {
      const result = await grantPpvPurchase(input.userId, resolved.intent.uploadId, { recordPayment: true });
      if (!result.ok) return result;
    } else if (resolved.intent.type === "subscribe") {
      await grantCreatorSubscription(input.userId, resolved.intent.creatorUserId, { recordPayment: true });
    } else {
      const result = await grantTip(
        input.userId,
        resolved.intent.creatorUserId,
        resolved.intent.amountCents,
        resolved.intent.message,
        { recordPayment: true },
      );
      if (!result.ok) return result;
    }

    return { ok: true as const, devCheckout: true as const, redirectUrl: returnUrl };
  }

  if (!isCcbillCreatorCheckoutConfigured()) {
    return { ok: false as const, error: "Creator checkout is not configured." };
  }

  const pending = await createPendingCheckout(input.userId, resolved.intent);
  const flexformId = resolveCreatorFlexformId(resolved.intent.type === "subscribe" ? "subscription" : "onetime");
  if (!flexformId) {
    return { ok: false as const, error: "Creator checkout forms are not configured." };
  }

  const checkoutUrl = buildCcbillDynamicCheckoutUrl({
    userId: input.userId,
    email: input.email,
    amountCents: resolved.intent.amountCents,
    returnUrl,
    flexformId,
    checkoutRef: pending.id,
    recurring: resolved.intent.type === "subscribe",
  });

  if (!checkoutUrl) {
    return { ok: false as const, error: "Could not build checkout URL." };
  }

  return { ok: true as const, checkoutUrl, provider: "ccbill" as const, checkoutRef: pending.id };
}

export async function fulfillCreatorCheckout(checkoutRef: string, providerRef?: string) {
  const pending = await prisma.paymentRecord.findUnique({ where: { id: checkoutRef } });
  if (!pending) return { ok: false as const, error: "Checkout not found." };
  if (pending.status === "paid") return { ok: true as const, alreadyFulfilled: true as const };
  if (pending.status !== "pending") return { ok: false as const, error: "Checkout is not pending." };

  const intent = parseCreatorCheckoutIntent(pending.description);
  if (!intent) return { ok: false as const, error: "Invalid checkout intent." };

  if (intent.type === "ppv") {
    const result = await grantPpvPurchase(pending.userId, intent.uploadId, { recordPayment: false });
    if (!result.ok) return result;
  } else if (intent.type === "subscribe") {
    await grantCreatorSubscription(pending.userId, intent.creatorUserId, { recordPayment: false });
  } else {
    const result = await grantTip(
      pending.userId,
      intent.creatorUserId,
      intent.amountCents,
      intent.message,
      { recordPayment: false },
    );
    if (!result.ok) return result;
  }

  await prisma.paymentRecord.update({
    where: { id: pending.id },
    data: {
      status: "paid",
      providerRef: providerRef ?? pending.providerRef,
      description: intent.type === "ppv" ? `PPV: ${intent.title}` : pending.description,
    },
  });

  return { ok: true as const };
}
