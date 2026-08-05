import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { buildCcbillCheckoutUrl, isCcbillConfigured } from "@/services/billing/ccbill";
import { isDevBillingEnabled, processDevCheckout } from "@/services/billing/dev-checkout";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({ planSlug: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: authResult.userId } });
  if (!user?.email) {
    return NextResponse.json({ error: "Email required for checkout." }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: parsed.data.planSlug } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const appUrl = new URL(request.url).origin;
  const returnUrl = `${appUrl}/subscriptions`;

  if (isCcbillConfigured()) {
    const checkoutUrl = buildCcbillCheckoutUrl({
      userId: authResult.userId,
      email: user.email,
      planSlug: parsed.data.planSlug,
      returnUrl: `${returnUrl}?billing=success`,
    });

    if (checkoutUrl) {
      return NextResponse.json({ checkoutUrl, provider: "ccbill" });
    }
  }

  if (isDevBillingEnabled()) {
    const result = await processDevCheckout({
      userId: authResult.userId,
      planSlug: parsed.data.planSlug,
      returnUrl,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      devCheckout: true,
      redirectUrl: result.redirectUrl,
      message: "Dev checkout complete — premium access is active.",
    });
  }

  return NextResponse.json(
    {
      error:
        "Payments are not configured yet. Add CCBILL_* variables for production, or set BILLING_DEV_MODE=true for local testing.",
      code: "BILLING_NOT_CONFIGURED",
    },
    { status: 503 },
  );
}
