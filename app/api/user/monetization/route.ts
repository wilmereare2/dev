import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import {
  CREATOR_MONETIZATION_UNAVAILABLE,
  isCreatorMonetizationEnabled,
} from "@/services/billing/creator-monetization";
import { startCreatorCheckout } from "@/services/billing/creator-checkout";
import { prisma } from "@/lib/db/prisma";

function monetizationUnavailableResponse() {
  return NextResponse.json(
    { error: CREATOR_MONETIZATION_UNAVAILABLE, code: "BILLING_NOT_CONFIGURED" },
    { status: 503 },
  );
}

const bodySchema = z.object({
  action: z.enum(["purchase", "subscribe", "tip"]),
  uploadId: z.string().min(1).optional(),
  creatorUserId: z.string().min(1).optional(),
  amountCents: z.number().int().min(100).optional(),
  message: z.string().trim().max(500).optional(),
  returnPath: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  if (!isCreatorMonetizationEnabled()) {
    return monetizationUnavailableResponse();
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user?.email) {
    return NextResponse.json({ error: "Email required for checkout." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const result = await startCreatorCheckout({
    userId: auth.userId,
    email: user.email,
    origin,
    action: parsed.data.action,
    uploadId: parsed.data.uploadId,
    creatorUserId: parsed.data.creatorUserId,
    amountCents: parsed.data.amountCents,
    message: parsed.data.message,
    returnPath: parsed.data.returnPath,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if ("checkoutUrl" in result) {
    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      checkoutRef: result.checkoutRef,
    });
  }

  return NextResponse.json({
    ok: true,
    devCheckout: true,
    redirectUrl: result.redirectUrl,
  });
}
