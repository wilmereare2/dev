import { sanityClient, safeSanityFetch } from "@/lib/sanity/client";
import { decodeRouteParam } from "@/lib/site/route-params";
import type { SanityContentCard } from "@/types/sanity-content";
import { CONTENT_BY_SLUG_QUERY, EXPLORE_CONTENT_QUERY } from "@/services/sanity/queries";
export async function fetchExploreContent(): Promise<SanityContentCard[]> {
  const client = sanityClient;
  if (!client) return [];

  return safeSanityFetch(
    "explore",
    () => client.fetch<SanityContentCard[]>(EXPLORE_CONTENT_QUERY, {}, { next: { revalidate: 60 } }),
    [],
  );
}

export type ContentDetail = Omit<SanityContentCard, "creators"> & {
  videoUrl?: string;
  playbackUrl?: string;
  categories?: { title: string; slug: string }[];
  tags?: { title: string; slug: string }[];
  creators?: { _id: string; name: string; slug: string; avatar?: unknown }[];
};

export async function fetchContentBySlug(slug: string): Promise<ContentDetail | null> {
  const client = sanityClient;
  if (!client) return null;

  const normalizedSlug = decodeRouteParam(slug);

  return safeSanityFetch(
    `content/${normalizedSlug}`,
    () =>
      client.fetch<ContentDetail | null>(
        CONTENT_BY_SLUG_QUERY,
        { slug: normalizedSlug },
        { next: { revalidate: 60 } },
      ),
    null,
  );
}
