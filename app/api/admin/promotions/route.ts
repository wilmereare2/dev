import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import {
  countPromotionsByStatus,
  listPromotionsForAdmin,
  mapAdminPromotion,
} from "@/services/admin/promotions";

export async function GET(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const countsOnly = searchParams.get("counts") === "1";

  if (countsOnly) {
    return NextResponse.json({ counts: await countPromotionsByStatus() });
  }

  const items = await listPromotionsForAdmin({ status: status || undefined });
  return NextResponse.json({ items: items.map(mapAdminPromotion) });
}
