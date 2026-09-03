import { ALLOWED_IMAGE_TYPES, MAX_CREATOR_IMAGE_BYTES, validateCreatorFile } from "@/lib/creator/media";
import { bufferToDataUrl } from "@/lib/creator/media";

export const MAX_AD_IMAGE_BYTES = MAX_CREATOR_IMAGE_BYTES;

export function validateAdImageUpload(file: File) {
  return validateCreatorFile(file, "image");
}

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
