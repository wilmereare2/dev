/**
 * Client-side banner downscaling.
 *
 * Admins routinely pick straight-from-camera or screenshot PNGs that are far
 * larger than any banner slot needs. Shrinking before upload keeps requests
 * well under proxy body limits and makes the stored creative cheap to serve.
 */

const MAX_EDGE = 2000;
const TARGET_TYPE = "image/webp";
const QUALITY = 0.86;

/** Files at or below this size are already small enough to leave alone. */
const SKIP_BELOW_BYTES = 400 * 1024;

function canUseCanvas() {
  return (
    typeof document !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

async function toBitmap(file: File) {
  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceExtension(name: string, extension: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base || "banner"}.${extension}`;
}

/**
 * Returns a smaller file when it can, otherwise the original. Animated GIFs are
 * passed through untouched — rasterizing them would drop the animation.
 */
export async function prepareBannerFile(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;
  if (!canUseCanvas()) return file;

  const bitmap = await toBitmap(file);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, TARGET_TYPE, QUALITY);
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, "webp"), {
      type: TARGET_TYPE,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
