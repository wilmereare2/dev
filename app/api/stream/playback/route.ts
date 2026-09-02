import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { userHasActiveSubscription } from "@/lib/auth/entitlements";
import { resolvePlayback } from "@/lib/streaming/playback";
import { fetchContentBySlug } from "@/services/sanity/content";
import { decodeRouteParam } from "@/lib/site/route-params";

const querySchema = z.object({ slug: z.string().min(1) });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ slug: searchParams.get("slug") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const item = await fetchContentBySlug(decodeRouteParam(parsed.data.slug));
  if (!item) {
    return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  const session = await auth();
  const hasSubscription = session?.user?.id ? await userHasActiveSubscription(session.user.id) : false;
  const isPremium = Boolean((item as { isPremium?: boolean }).isPremium);

  const playback = await resolvePlayback({
    playbackUrl: item.playbackUrl,
    streamAssetId: (item as { streamAssetId?: string }).streamAssetId,
    userId: session?.user?.id,
    isPremium,
    hasSubscription,
  });

  if (!playback && isPremium && !hasSubscription) {
    return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  }

  if (!playback) {
    return NextResponse.json({ playbackUrl: null, embedUrl: null, provider: null });
  }

  if (playback.kind === "embed") {
    return NextResponse.json({
      playbackUrl: null,
      embedUrl: playback.embedUrl,
      provider: playback.provider,
    });
  }

  return NextResponse.json({
    playbackUrl: playback.url,
    embedUrl: null,
    provider: null,
  });
}
