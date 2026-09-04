import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/api-guards";
import {
  deleteAdvertisement,
  getAdvertisementForAdmin,
  setAdvertisementStatus,
  updateAdvertisement,
} from "@/services/admin/advertisements";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  advertiserName: z.string().trim().min(1).max(200).optional(),
  destinationUrl: z.string().trim().min(1).optional(),
  placement: z.string().trim().min(1).optional(),
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
  action: z.enum(["activate", "pause", "archive", "draft"]).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const advertisement = await getAdvertisementForAdmin(id);
  if (!advertisement) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ advertisement });
}

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const existing = await getAdvertisementForAdmin(id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  if (parsed.data.action) {
    const statusMap = {
      activate: "active",
      pause: "paused",
      archive: "archived",
      draft: "draft",
    } as const;
    const statusResult = await setAdvertisementStatus(id, statusMap[parsed.data.action]);
    if (!statusResult.ok) {
      return NextResponse.json({ error: statusResult.error }, { status: statusResult.status ?? 400 });
    }
    return NextResponse.json({ advertisement: statusResult.advertisement });
  }

  const result = await updateAdvertisement(id, {
    title: parsed.data.title ?? existing.title,
    advertiserName: parsed.data.advertiserName ?? existing.advertiserName,
    destinationUrl: parsed.data.destinationUrl ?? existing.destinationUrl,
    placement: parsed.data.placement ?? existing.placement,
    creativeType: parsed.data.creativeType ?? existing.creativeType,
    networkName: parsed.data.networkName !== undefined ? parsed.data.networkName : existing.networkName,
    embedCode: parsed.data.embedCode !== undefined ? parsed.data.embedCode : existing.embedCode,
    iframeUrl: parsed.data.iframeUrl !== undefined ? parsed.data.iframeUrl : existing.iframeUrl,
    status: parsed.data.status ?? existing.status,
    priority: parsed.data.priority ?? existing.priority,
    startAt: parsed.data.startAt !== undefined ? parsed.data.startAt : existing.startAt,
    endAt: parsed.data.endAt !== undefined ? parsed.data.endAt : existing.endAt,
    imageUrl: parsed.data.imageUrl !== undefined ? parsed.data.imageUrl : existing.imageUrl,
    imageUrlTablet:
      parsed.data.imageUrlTablet !== undefined ? parsed.data.imageUrlTablet : existing.imageUrlTablet,
    imageUrlMobile:
      parsed.data.imageUrlMobile !== undefined ? parsed.data.imageUrlMobile : existing.imageUrlMobile,
    altText: parsed.data.altText !== undefined ? parsed.data.altText : existing.altText,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: "status" in result && result.status ? result.status : 400 },
    );
  }

  return NextResponse.json({ advertisement: result.advertisement });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const ok = await deleteAdvertisement(id);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
