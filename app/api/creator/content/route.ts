import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatorUser } from "@/lib/api/require-creator";
import { bufferToDataUrl, validateCreatorFile } from "@/lib/creator/media";
import {
  createCreatorUpload,
  listCreatorUploads,
  mapUpload,
} from "@/services/creator/uploads";
import type { ContentVisibility, MediaType } from "@/types";

export async function GET(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const items = await listCreatorUploads(auth.userId, status as never);
  return NextResponse.json({ items });
}

const jsonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  mediaType: z.enum(["photo", "video", "gallery", "gif", "audio", "preview", "text"]).optional(),
  visibility: z.enum(["public", "followers", "subscribers", "private"]).optional(),
  mediaUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(20).optional(),
  categories: z.array(z.string()).max(10).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  isPremium: z.boolean().optional(),
  ppvPriceCents: z.number().int().min(0).nullable().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  resolution: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    const categoriesRaw = String(formData.get("categories") ?? "").trim();
    const categories = categoriesRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (categories.length === 0) {
      return NextResponse.json({ error: "Choose at least one category." }, { status: 400 });
    }

    const mediaType = (String(formData.get("mediaType") ?? "video") as MediaType) || "video";
    const description = String(formData.get("description") ?? "").trim() || undefined;

    if (mediaType === "text" && !description) {
      return NextResponse.json({ error: "Text posts need a description body." }, { status: 400 });
    }

    let thumbnailUrl: string | undefined;
    let mediaUrl = String(formData.get("mediaUrl") ?? "").trim() || undefined;
    let fileSizeBytes: number | undefined;

    const thumbnail = formData.get("thumbnail");
    if (thumbnail instanceof File && thumbnail.size > 0) {
      const valid = validateCreatorFile(thumbnail, "image");
      if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
      const buffer = Buffer.from(await thumbnail.arrayBuffer());
      thumbnailUrl = bufferToDataUrl(buffer, thumbnail.type);
      fileSizeBytes = thumbnail.size;
    }

    const media = formData.get("media");
    if (media instanceof File && media.size > 0) {
      const kind = media.type.startsWith("video/") ? "video" : media.type.startsWith("audio/") ? "audio" : "image";
      const valid = validateCreatorFile(media, kind);
      if (!valid.ok) return NextResponse.json({ error: valid.error }, { status: 400 });
      if (kind === "image") {
        const buffer = Buffer.from(await media.arrayBuffer());
        thumbnailUrl = bufferToDataUrl(buffer, media.type);
      } else {
        const buffer = Buffer.from(await media.arrayBuffer());
        mediaUrl = bufferToDataUrl(buffer, media.type);
      }
      fileSizeBytes = (fileSizeBytes ?? 0) + media.size;
    }

    const upload = await createCreatorUpload(auth.userId, {
      title,
      description,
      mediaType,
      visibility: (String(formData.get("visibility") ?? "public") as ContentVisibility) || "public",
      thumbnailUrl,
      mediaUrl,
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categories,
      isPremium: formData.get("isPremium") === "true",
      ppvPriceCents: formData.get("ppvPriceCents") ? Number(formData.get("ppvPriceCents")) : null,
      fileSizeBytes,
      durationSeconds: formData.get("durationSeconds") ? Number(formData.get("durationSeconds")) : undefined,
    });

    return NextResponse.json({ upload: mapUpload(upload) }, { status: 201 });
  }

  const body = await request.json().catch(() => null);
  const parsed = jsonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload data." }, { status: 400 });
  }

  const upload = await createCreatorUpload(auth.userId, {
    ...parsed.data,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
  });

  return NextResponse.json({ upload: mapUpload(upload) }, { status: 201 });
}
