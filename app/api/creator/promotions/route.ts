import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatorUser } from "@/lib/api/require-creator";
import { createPromotion, deletePromotion, listPromotions, updatePromotion } from "@/services/creator/promotions";

export async function GET() {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const items = await listPromotions(auth.userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
  bannerUrl: z.string().optional(),
  teaserVideoUrl: z.string().optional(),
  couponCode: z.string().trim().max(40).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  externalUrl: z.string().url().optional(),
  featuredContentId: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid promotion data." }, { status: 400 });
  }

  const promotion = await createPromotion({
    creatorUserId: auth.userId,
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });

  return NextResponse.json({ promotion }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ id: z.string().min(1), ...bodySchema.partial().shape })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid promotion data." }, { status: 400 });
  }

  const promotion = await updatePromotion(
    parsed.data.id,
    { creatorUserId: auth.userId },
    {
      ...parsed.data,
      expiresAt:
        parsed.data.expiresAt === undefined
          ? undefined
          : parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : null,
    },
  );

  if (!promotion) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ promotion });
}

export async function DELETE(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const ok = await deletePromotion(id, { creatorUserId: auth.userId });
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
