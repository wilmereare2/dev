import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import {
  getBusinessAccountForUser,
  getOrCreateBusinessAccount,
  updateBusinessAccount,
} from "@/services/business/accounts";
import { createPromotion, listBusinessPromotions } from "@/services/creator/promotions";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const business = await getBusinessAccountForUser(auth.userId);
  if (!business) return NextResponse.json({ business: null });

  const promotions = await listBusinessPromotions(business.id);
  return NextResponse.json({ business, promotions });
}

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  bannerUrl: z.string().optional(),
  affiliateUrl: z.string().url().optional().or(z.literal("")),
  create: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid business data." }, { status: 400 });
  }

  let business = await getBusinessAccountForUser(auth.userId);
  if (!business && parsed.data.create && parsed.data.name) {
    await getOrCreateBusinessAccount(auth.userId, parsed.data.name);
    await import("@/lib/db/prisma").then(({ prisma }) =>
      prisma.user.update({ where: { id: auth.userId }, data: { role: "BUSINESS" } }),
    );
    business = await getBusinessAccountForUser(auth.userId);
  }

  if (!business) {
    return NextResponse.json({ error: "Business account not found." }, { status: 404 });
  }

  if (parsed.data.name || parsed.data.description || parsed.data.bannerUrl || parsed.data.affiliateUrl !== undefined) {
    await updateBusinessAccount(business.id, business.ownerUserId ?? auth.userId, {
      name: parsed.data.name,
      description: parsed.data.description,
      bannerUrl: parsed.data.bannerUrl,
      affiliateUrl: parsed.data.affiliateUrl || undefined,
    });
    business = await getBusinessAccountForUser(auth.userId);
  }

  return NextResponse.json({ business });
}

const promoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
  bannerUrl: z.string().optional(),
  teaserVideoUrl: z.string().optional(),
  couponCode: z.string().trim().max(40).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  externalUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function PUT(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const business = await getBusinessAccountForUser(auth.userId);
  if (!business) return NextResponse.json({ error: "Business account not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = promoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid campaign data." }, { status: 400 });
  }

  const promotion = await createPromotion({
    businessId: business.id,
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });

  return NextResponse.json({ promotion }, { status: 201 });
}
