import { safeSanityFetch, sanityClient } from "@/lib/sanity/client";
import { SEARCH_CONTENT_QUERY } from "@/services/sanity/queries";
import type { SanityContentCard } from "@/types/sanity-content";

export async function searchContent(term: string): Promise<SanityContentCard[]> {
  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;

  if (elasticsearchUrl) {
    try {
      const response = await fetch(`${elasticsearchUrl.replace(/\/$/, "")}/manuelax/_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: { multi_match: { query: term, fields: ["title", "synopsis", "creators"] } },
          size: 48,
        }),
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          hits?: { hits?: { _source?: SanityContentCard }[] };
        };
        return payload.hits?.hits?.map((hit) => hit._source).filter(Boolean) as SanityContentCard[] ?? [];
      }
    } catch {
      /* fallback to GROQ */
    }
  }

  const client = sanityClient;
  if (!client) return [];

  return safeSanityFetch(
    `search/${term}`,
    () =>
      client.fetch<SanityContentCard[]>(
        SEARCH_CONTENT_QUERY,
        { term: term.trim() },
        { next: { revalidate: 60 } },
      ),
    [],
  );
}
