import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { sanityDataset, sanityProjectId, sanityConfigured } from "@/lib/sanity/env";

const builder =
  sanityConfigured && sanityProjectId
    ? createImageUrlBuilder({ projectId: sanityProjectId, dataset: sanityDataset })
    : null;

type ImageWithPixels = SanityImageSource & {
  outputWidth?: number;
  outputHeight?: number;
};

/** True when the Sanity image object includes an upload reference. */
export function hasSanityImage(source: SanityImageSource | null | undefined): source is SanityImageSource {
  if (!source || typeof source !== "object") return false;
  const record = source as Record<string, unknown>;
  const asset = record.asset as Record<string, unknown> | undefined;
  if (asset?._ref && typeof asset._ref === "string") return true;
  if (record._ref && typeof record._ref === "string") return true;
  return false;
}

export type SanityImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

export function sanityImageUrl(
  source: SanityImageSource | null | undefined,
  fallbackWidth: number,
  options?: SanityImageOptions,
) {
  if (!builder || !hasSanityImage(source)) return null;

  const record = source as ImageWithPixels;
  const width = options?.width ?? record.outputWidth ?? fallbackWidth;
  const height = options?.height ?? record.outputHeight;
  const quality = options?.quality ?? 85;

  try {
    let imageBuilder = builder.image(source).width(width).auto("format").quality(quality);
    if (height && height > 0) {
      imageBuilder = imageBuilder.height(height).fit("crop");
    }
    const url = imageBuilder.url();
    return url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}
