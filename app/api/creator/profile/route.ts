import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatorUser } from "@/lib/api/require-creator";
import { getOrCreateCreatorProfile, ensureSanityCreatorDoc } from "@/services/creator/profile";
import { setCreatorSubscriptionPrice } from "@/services/creator/monetization";

export async function GET() {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const profile = await getOrCreateCreatorProfile(auth.userId);
  return NextResponse.json({ profile });
}

const patchSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(500).optional(),
  subscriptionPriceCents: z.number().int().min(0).max(99999).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  }

  await getOrCreateCreatorProfile(auth.userId);

  const { prisma } = await import("@/lib/db/prisma");
  const profile = await prisma.creatorProfile.update({
    where: { userId: auth.userId },
    data: {
      ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
    },
  });

  if (parsed.data.subscriptionPriceCents !== undefined) {
    await setCreatorSubscriptionPrice(auth.userId, parsed.data.subscriptionPriceCents);
  }

  await ensureSanityCreatorDoc(auth.userId);

  return NextResponse.json({ profile });
}
