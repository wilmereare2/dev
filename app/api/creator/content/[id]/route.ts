import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatorUser } from "@/lib/api/require-creator";
import {
  deleteCreatorUpload,
  getCreatorUpload,
  mapUpload,
  submitUploadForReview,
  updateCreatorUpload,
} from "@/services/creator/uploads";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const upload = await getCreatorUpload(id, auth.userId);
  if (!upload) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ upload: mapUpload(upload) });
}

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  mediaType: z.enum(["photo", "video", "gallery", "gif", "audio", "preview"]).optional(),
  visibility: z.enum(["public", "followers", "subscribers", "private"]).optional(),
  mediaUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).max(20).optional(),
  categories: z.array(z.string()).max(10).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  isPremium: z.boolean().optional(),
  ppvPriceCents: z.number().int().min(0).nullable().optional(),
  action: z.enum(["submit"]).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  if (parsed.data.action === "submit") {
    const upload = await submitUploadForReview(id, auth.userId);
    if (!upload) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ upload: mapUpload(upload) });
  }

  try {
    const upload = await updateCreatorUpload(id, auth.userId, {
      ...parsed.data,
      scheduledAt:
        parsed.data.scheduledAt === undefined
          ? undefined
          : parsed.data.scheduledAt
            ? new Date(parsed.data.scheduledAt)
            : null,
    });
    if (!upload) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ upload: mapUpload(upload) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update upload." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const ok = await deleteCreatorUpload(id, auth.userId);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
