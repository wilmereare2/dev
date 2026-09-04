import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdImpressions } from "@/services/ads/advertisements";

const bodySchema = z.object({
  impressions: z
    .array(
      z.object({
        adId: z.string().min(1).max(64),
        dedupeKey: z.string().min(8).max(128),
      }),
    )
    .min(1)
    .max(12),
});

/** Batched counterpart to /api/ads/impression — one call per page view. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid impression payload." }, { status: 400 });
  }

  const result = await recordAdImpressions(parsed.data.impressions);
  return NextResponse.json(result);
}
