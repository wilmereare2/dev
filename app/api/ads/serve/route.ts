import { NextResponse } from "next/server";
import { isAdPlacement } from "@/lib/ads/placements";
import { selectAdvertisementForPlacement } from "@/services/ads/advertisements";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") ?? "";

  if (!isAdPlacement(placement)) {
    return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  }

  const ad = await selectAdvertisementForPlacement(placement);
  if (!ad) {
    return NextResponse.json({ ad: null });
  }

  return NextResponse.json(
    { ad },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
