import { sanityClient, safeSanityFetch } from "@/lib/sanity/client";
import type { SanityContentCard } from "@/types/sanity-content";
import {
  CATEGORIES_INDEX_QUERY,
  CONTENT_BY_IDS_QUERY,
  NEWEST_CONTENT_QUERY,
  POPULAR_CONTENT_QUERY,
  TAGS_INDEX_QUERY,
  TRENDING_CONTENT_QUERY,
} from "@/services/sanity/queries";

import type { SanityImageSource } from "@sanity/image-url";

export type SanityCategoryCard = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: SanityImageSource;
};

export type SanityTagCard = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
};

export async function fetchNewestContent() {
  const client = sanityClient;
  if (!client) return [];
  return safeSanityFetch(
    "newest",
    () => client.fetch<SanityContentCard[]>(NEWEST_CONTENT_QUERY, {}, { next: { revalidate: 60 } }),
    [],
  );
}

export async function fetchPopularContent() {
  const client = sanityClient;
  if (!client) return [];
  return safeSanityFetch(
    "popular",
    () => client.fetch<SanityContentCard[]>(POPULAR_CONTENT_QUERY, {}, { next: { revalidate: 60 } }),
    [],
  );
}

export async function fetchTrendingContent() {
  const client = sanityClient;
  if (!client) return [];
  return safeSanityFetch(
    "trending",
    () => client.fetch<SanityContentCard[]>(TRENDING_CONTENT_QUERY, {}, { next: { revalidate: 60 } }),
    [],
  );
}

export async function searchContent(term: string) {
  const { searchContent: elasticSearch } = await import("@/services/search/elasticsearch");
  return elasticSearch(term);
}

export async function fetchCategoriesIndex() {
  const client = sanityClient;
  if (!client) return [];
  return safeSanityFetch(
    "categories",
    () => client.fetch<SanityCategoryCard[]>(CATEGORIES_INDEX_QUERY, {}, { next: { revalidate: 120 } }),
    [],
  );
}

export async function fetchTagsIndex() {
  const client = sanityClient;
  if (!client) return [];
  return safeSanityFetch(
    "tags",
    () => client.fetch<SanityTagCard[]>(TAGS_INDEX_QUERY, {}, { next: { revalidate: 120 } }),
    [],
  );
}

export async function fetchContentByIds(ids: string[]) {
  const client = sanityClient;
  if (!client || ids.length === 0) return [];
  return safeSanityFetch(
    "content-by-ids",
    () => client.fetch<SanityContentCard[]>(CONTENT_BY_IDS_QUERY, { ids }, { next: { revalidate: 60 } }),
    [],
  );
}
