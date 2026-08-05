import { NextResponse } from "next/server";
import { listActivePromotions, mapPublicPromotion } from "@/services/creator/promotions";

export async function GET() {
  const items = await listActivePromotions();
  return NextResponse.json({ items: items.map(mapPublicPromotion) });
}
