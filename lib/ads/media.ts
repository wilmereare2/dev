import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { ALLOWED_IMAGE_TYPES, MAX_CREATOR_IMAGE_BYTES, validateCreatorFile } from "@/lib/creator/media";
import { adCreativePath } from "@/lib/ads/creative-path";
import { bufferToDataUrl } from "@/lib/creator/media";

export const MAX_AD_IMAGE_BYTES = MAX_CREATOR_IMAGE_BYTES;

export { AD_CREATIVE_PATH_PREFIX, adCreativePath, isAdCreativePath, parseAdCreativeId } from "@/lib/ads/creative-path";

export function validateAdImageUpload(file: File) {
  return validateCreatorFile(file, "image");
}

/**
 * Persists the upload and returns a short reference path. Creatives are
 * de-duplicated by checksum so re-uploading the same banner reuses one row.
 */
export async function storeAdImageFile(file: File, createdById: string | null) {
  const valid = validateAdImageUpload(file);
  if (!valid.ok) return valid;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return { ok: false as const, error: "Choose an image to upload." };
  }
  if (buffer.length > MAX_AD_IMAGE_BYTES) {
    return { ok: false as const, error: "Image must be 5 MB or smaller." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false as const, error: "Unsupported image type." };
  }

  const checksum = createHash("sha256").update(buffer).digest("hex");

  const existing = await prisma.adCreative.findUnique({
    where: { checksum },
    select: { id: true },
  });
  if (existing) {
    return { ok: true as const, id: existing.id, url: adCreativePath(existing.id) };
  }

  const created = await prisma.adCreative.create({
    data: {
      mimeType: file.type,
      byteSize: buffer.length,
      checksum,
      data: buffer,
      createdById,
    },
    select: { id: true },
  });

  return { ok: true as const, id: created.id, url: adCreativePath(created.id) };
}

export async function getAdCreative(id: string) {
  return prisma.adCreative.findUnique({
    where: { id },
    select: { data: true, mimeType: true, byteSize: true, checksum: true },
  });
}

/** @deprecated Legacy inline encoding — retained for older records only. */
export async function adImageFileToDataUrl(file: File) {
  const valid = validateAdImageUpload(file);
  if (!valid.ok) return valid;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_AD_IMAGE_BYTES) {
    return { ok: false as const, error: "Image must be 5 MB or smaller." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false as const, error: "Unsupported image type." };
  }

  return { ok: true as const, url: bufferToDataUrl(buffer, file.type) };
}
