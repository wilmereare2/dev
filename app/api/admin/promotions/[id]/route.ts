import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/api-guards";
import { deletePromotionAsAdmin, moderatePromotion } from "@/services/admin/promotions";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  action: z.enum(["publish", "remove", "flag", "restore", "delete"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  }

  if (parsed.data.action === "delete") {
    const ok = await deletePromotionAsAdmin(id);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const promotion = await moderatePromotion({ promotionId: id, action: parsed.data.action });
  if (!promotion) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ promotion });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const ok = await deletePromotionAsAdmin(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
