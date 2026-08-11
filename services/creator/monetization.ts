import { prisma } from "@/lib/db/prisma";
import { userHasActiveSubscription } from "@/lib/auth/entitlements";
import { isDevBillingEnabled } from "@/services/billing/dev-checkout";

function devPaymentLabel(description: string) {
  return isDevBillingEnabled() ? `${description} (dev checkout)` : description;
}

export async function userHasCreatorSubscription(subscriberId: string, creatorUserId: string) {
  const sub = await prisma.creatorSubscription.findFirst({
    where: {
      subscriberId,
      creatorUserId,
      status: "active",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
  });
  return Boolean(sub);
}

export async function userHasPurchasedContent(userId: string, uploadId: string) {
  const purchase = await prisma.contentPurchase.findFirst({
    where: { userId, uploadId },
  });
  return Boolean(purchase);
}

export async function userFollowsCreator(userId: string, creatorUserId: string) {
  const follow = await prisma.creatorFollow.findUnique({
    where: { userId_creatorId: { userId, creatorId: creatorUserId } },
  });
  return Boolean(follow);
}

export async function canAccessCreatorContent(
  userId: string | undefined,
  upload: {
    creatorUserId: string;
    visibility: string;
    isPremium: boolean;
    ppvPriceCents: number | null;
    id: string;
  },
) {
  if (upload.visibility === "private") {
    return userId === upload.creatorUserId;
  }

  if (!userId) {
    return upload.visibility === "public" && !upload.isPremium && !upload.ppvPriceCents;
  }

  if (userId === upload.creatorUserId) return true;

  if (upload.ppvPriceCents && upload.ppvPriceCents > 0) {
    const purchased = await userHasPurchasedContent(userId, upload.id);
    if (!purchased) return false;
  }

  if (upload.visibility === "followers") {
    const follows = await userFollowsCreator(userId, upload.creatorUserId);
    if (!follows) return false;
  }

  if (upload.visibility === "subscribers") {
    const sub = await userHasCreatorSubscription(userId, upload.creatorUserId);
    if (!sub) return false;
  }

  if (upload.isPremium) {
    const platformSub = await userHasActiveSubscription(userId);
    const creatorSub = await userHasCreatorSubscription(userId, upload.creatorUserId);
    if (!platformSub && !creatorSub) return false;
  }

  return true;
}

export type MemberPostAccessDenialReason =
  | "sign_in"
  | "ppv"
  | "premium"
  | "followers"
  | "subscribers";

export type MemberPostAccess =
  | { canAccess: true }
  | { canAccess: false; reason: MemberPostAccessDenialReason };

export async function resolveMemberPostAccess(
  userId: string | undefined,
  upload: {
    creatorUserId: string;
    visibility: string;
    isPremium: boolean;
    ppvPriceCents: number | null;
    id: string;
  },
): Promise<MemberPostAccess> {
  if (await canAccessCreatorContent(userId, upload)) {
    return { canAccess: true };
  }

  if (!userId) {
    if (upload.ppvPriceCents && upload.ppvPriceCents > 0) {
      return { canAccess: false, reason: "ppv" };
    }
    if (upload.isPremium) {
      return { canAccess: false, reason: "premium" };
    }
    if (upload.visibility === "followers") {
      return { canAccess: false, reason: "followers" };
    }
    if (upload.visibility === "subscribers") {
      return { canAccess: false, reason: "subscribers" };
    }
    return { canAccess: false, reason: "sign_in" };
  }

  if (upload.ppvPriceCents && upload.ppvPriceCents > 0) {
    const purchased = await userHasPurchasedContent(userId, upload.id);
    if (!purchased) return { canAccess: false, reason: "ppv" };
  }

  if (upload.visibility === "followers") {
    const follows = await userFollowsCreator(userId, upload.creatorUserId);
    if (!follows) return { canAccess: false, reason: "followers" };
  }

  if (upload.visibility === "subscribers") {
    const sub = await userHasCreatorSubscription(userId, upload.creatorUserId);
    if (!sub) return { canAccess: false, reason: "subscribers" };
  }

  if (upload.isPremium) {
    const platformSub = await userHasActiveSubscription(userId);
    const creatorSub = await userHasCreatorSubscription(userId, upload.creatorUserId);
    if (!platformSub && !creatorSub) return { canAccess: false, reason: "premium" };
  }

  return { canAccess: false, reason: "sign_in" };
}

export async function grantPpvPurchase(
  userId: string,
  uploadId: string,
  options?: { recordPayment?: boolean; paymentDescription?: string },
) {
  const upload = await prisma.creatorUpload.findUnique({ where: { id: uploadId } });
  if (!upload?.ppvPriceCents || upload.ppvPriceCents <= 0) {
    return { ok: false as const, error: "This content is not pay-per-view." };
  }

  const existing = await prisma.contentPurchase.findFirst({ where: { userId, uploadId } });
  if (existing) return { ok: true as const, purchase: existing };

  const purchase = await prisma.$transaction(async (tx) => {
    const record = await tx.contentPurchase.create({
      data: {
        userId,
        uploadId,
        contentId: upload.sanityContentId,
        amountCents: upload.ppvPriceCents!,
        type: "ppv",
      },
    });
    await tx.creatorUpload.update({
      where: { id: uploadId },
      data: { purchaseCount: { increment: 1 } },
    });
    if (options?.recordPayment) {
      await tx.paymentRecord.create({
        data: {
          userId,
          amountCents: upload.ppvPriceCents!,
          status: "completed",
          description: options.paymentDescription ?? devPaymentLabel(`PPV: ${upload.title}`),
        },
      });
    }
    return record;
  });

  return { ok: true as const, purchase };
}

export async function grantCreatorSubscription(
  subscriberId: string,
  creatorUserId: string,
  options?: { recordPayment?: boolean; paymentDescription?: string },
) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
  const priceCents = profile?.subscriptionPriceCents ?? 999;

  const sub = await prisma.creatorSubscription.upsert({
    where: { subscriberId_creatorUserId: { subscriberId, creatorUserId } },
    create: {
      subscriberId,
      creatorUserId,
      priceCents,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  if (options?.recordPayment) {
    await prisma.paymentRecord.create({
      data: {
        userId: subscriberId,
        amountCents: priceCents,
        status: "completed",
        description: options.paymentDescription ?? devPaymentLabel("Creator subscription"),
      },
    });
  }

  return sub;
}

export async function grantTip(
  fromUserId: string,
  toCreatorUserId: string,
  amountCents: number,
  message?: string,
  options?: { recordPayment?: boolean; paymentDescription?: string },
) {
  if (amountCents < 100) {
    return { ok: false as const, error: "Minimum tip is $1.00." };
  }

  const tip = await prisma.$transaction(async (tx) => {
    const record = await tx.tip.create({
      data: { fromUserId, toCreatorUserId, amountCents, message: message?.trim() || null },
    });
    if (options?.recordPayment) {
      await tx.paymentRecord.create({
        data: {
          userId: fromUserId,
          amountCents,
          status: "completed",
          description: options.paymentDescription ?? devPaymentLabel("Creator tip"),
        },
      });
    }
    await tx.notification.create({
      data: {
        userId: toCreatorUserId,
        type: "tip_received",
        title: "New tip received",
        body: message ? `You received a tip: ${message}` : "You received a new tip.",
        href: "/creator-dashboard/earnings",
      },
    });
    return record;
  });

  return { ok: true as const, tip };
}

export async function purchaseContent(userId: string, uploadId: string) {
  return grantPpvPurchase(userId, uploadId, { recordPayment: true });
}

export async function subscribeToCreator(subscriberId: string, creatorUserId: string) {
  return grantCreatorSubscription(subscriberId, creatorUserId, { recordPayment: true });
}

export async function sendTip(fromUserId: string, toCreatorUserId: string, amountCents: number, message?: string) {
  return grantTip(fromUserId, toCreatorUserId, amountCents, message, { recordPayment: true });
}

export async function setCreatorSubscriptionPrice(creatorUserId: string, priceCents: number) {
  return prisma.creatorProfile.update({
    where: { userId: creatorUserId },
    data: { subscriptionPriceCents: priceCents },
  });
}
