import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdClick } from "@/services/ads/advertisements";

const bodySchema = z.object({
  adId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid click payload." }, { status: 400 });
  }

  const destinationUrl = await recordAdClick(parsed.data.adId);
  if (!destinationUrl) {
    return NextResponse.json({ error: "Ad not available." }, { status: 404 });
  }

  return NextResponse.json({ destinationUrl });
}
