import type { Metadata } from "next";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityImageUrl } from "@/lib/sanity/image";

export type SanitySeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: SanityImageSource;
  noIndex?: boolean;
};

export function metadataFromSanitySeo(
  seo: SanitySeoFields | null | undefined,
  fallback: { title: string; description: string },
): Metadata {
  const title = seo?.metaTitle?.trim() || fallback.title;
  const description = seo?.metaDescription?.trim() || fallback.description;
  const ogUrl = sanityImageUrl(seo?.ogImage, 1200);

  return {
    title,
    description,
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: seo?.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      ...(ogUrl ? { images: [{ url: ogUrl, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogUrl ? { images: [ogUrl] } : {}),
    },
  };
}
