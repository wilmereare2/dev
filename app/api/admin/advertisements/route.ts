import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/api-guards";
import {
  createAdvertisement,
  listAdvertisementsForAdmin,
  mapAdminAdvertisement,
} from "@/services/admin/advertisements";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  advertiserName: z.string().trim().min(1).max(200),
  destinationUrl: z.string().trim().default(""),
  placement: z.string().trim().min(1),
  creativeType: z.enum(["direct", "script", "iframe"]).optional(),
  networkName: z.string().trim().max(80).nullable().optional(),
  embedCode: z.string().max(20_000).nullable().optional(),
  iframeUrl: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageUrlTablet: z.string().nullable().optional(),
  imageUrlMobile: z.string().nullable().optional(),
  altText: z.string().trim().max(300).nullable().optional(),
});

export async function GET(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const placement = searchParams.get("placement") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const items = await listAdvertisementsForAdmin({ status, placement, q });
  return NextResponse.json({ items: items.map(mapAdminAdvertisement) });
}

export async function POST(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid advertisement payload." }, { status: 400 });
  }

  const result = await createAdvertisement(parsed.data, authResult.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ advertisement: result.advertisement }, { status: 201 });
}
