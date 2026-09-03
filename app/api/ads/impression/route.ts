import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdImpression } from "@/services/ads/advertisements";

const bodySchema = z.object({
  adId: z.string().min(1),
  dedupeKey: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid impression payload." }, { status: 400 });
  }

  const result = await recordAdImpression(parsed.data.adId, parsed.data.dedupeKey);
  return NextResponse.json(result);
}
