import { sanityClient, safeSanityFetch } from "@/lib/sanity/client";

type SearchSuggestion = {
  id: string;
  label: string;
  href: string;
  kind: "content" | "creator" | "category" | "page";
};

const QUICK_LINKS: SearchSuggestion[] = [
  { id: "page-trending", label: "Trending", href: "/trending", kind: "page" },
  { id: "page-newest", label: "Newest releases", href: "/newest", kind: "page" },
  { id: "page-pricing", label: "Pricing & membership", href: "/pricing", kind: "page" },
  { id: "page-explore", label: "Explore catalog", href: "/explore", kind: "page" },
];

export async function fetchSearchSuggestions(term: string, limit = 8): Promise<SearchSuggestion[]> {
  const trimmed = term.trim();
  if (!trimmed) {
    return QUICK_LINKS;
  }

  const client = sanityClient;
  if (!client) return QUICK_LINKS;

  const results = await safeSanityFetch(
    `suggest/${trimmed}`,
    () =>
      client.fetch<{
        content: Array<{ _id: string; title: string; slug: string }>;
        creators: Array<{ _id: string; name: string; slug: string }>;
        categories: Array<{ _id: string; title: string; slug: string }>;
      }>(
        `{
          "content": *[_type == "content" && (title match $term + "*" || synopsis match $term + "*")] | order(publishedAt desc)[0...4]{
            _id, title, "slug": slug.current
          },
          "creators": *[_type == "creator" && name match $term + "*"] | order(name asc)[0...3]{
            _id, name, "slug": slug.current
          },
          "categories": *[_type == "category" && title match $term + "*"] | order(title asc)[0...3]{
            _id, title, "slug": slug.current
          }
        }`,
        { term: trimmed },
        { next: { revalidate: 60 } },
      ),
    { content: [], creators: [], categories: [] },
  );

  const suggestions: SearchSuggestion[] = [
    ...results.content.map((item) => ({
      id: item._id,
      label: item.title,
      href: `/content/${encodeURIComponent(item.slug)}`,
      kind: "content" as const,
    })),
    ...results.creators.map((item) => ({
      id: item._id,
      label: item.name,
      href: `/creator/${encodeURIComponent(item.slug)}`,
      kind: "creator" as const,
    })),
    ...results.categories.map((item) => ({
      id: item._id,
      label: item.title,
      href: `/categories/${encodeURIComponent(item.slug)}`,
      kind: "category" as const,
    })),
  ];

  return suggestions.slice(0, limit);
}

export { QUICK_LINKS };
