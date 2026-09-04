import { NextResponse } from "next/server";
import { isAdPlacement, type AdPlacement } from "@/lib/ads/placements";
import { selectAdvertisementsForPlacements } from "@/services/ads/advertisements";

/** Guard against a caller asking for an unbounded number of slots. */
const MAX_PLACEMENTS_PER_REQUEST = 12;

/**
 * Serves ads for one or more placements.
 *
 * `?placements=a,b,c` resolves every slot on the page in a single database
 * round trip. `?placement=a` is kept for older callers.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const requested = [
    ...(searchParams.get("placements")?.split(",") ?? []),
    ...searchParams.getAll("placement"),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  if (!requested.length) {
    return NextResponse.json({ error: "No placement requested." }, { status: 400 });
  }

  const valid = [...new Set(requested)].filter(isAdPlacement) as AdPlacement[];
  const invalid = [...new Set(requested)].filter((value) => !isAdPlacement(value));

  if (!valid.length) {
    return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  }
  if (valid.length > MAX_PLACEMENTS_PER_REQUEST) {
    return NextResponse.json({ error: "Too many placements requested." }, { status: 400 });
  }

  const ads = await selectAdvertisementsForPlacements(valid);

  // Unknown placements resolve to null rather than failing the whole page.
  for (const key of invalid) ads[key] = null;

  const single = searchParams.get("placement");

  return NextResponse.json(
    {
      ads,
      // Legacy single-placement shape.
      ...(single && !searchParams.get("placements") ? { ad: ads[single] ?? null } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
