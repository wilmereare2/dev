import type { Metadata } from "next";
import { ContentCard } from "@/components/content/content-card";
import { searchContent } from "@/services/sanity/catalog";
import { SearchForm } from "@/features/search/search-form";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the manuelaX catalog.",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const items = q ? await searchContent(q) : [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-2 text-secondary">Find creators, titles, and categories</p>
      <div className="mt-6 max-w-xl">
        <SearchForm initialQuery={q} />
      </div>
      {q ? (
        <>
          <p className="mt-8 text-sm text-secondary">
            {items.length} result{items.length === 1 ? "" : "s"} for “{q}”
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ContentCard key={item._id} item={item} />
            ))}
          </div>
          {!items.length ? (
            <p className="mt-6 text-sm text-muted-foreground">No results found. Try another search term.</p>
          ) : null}
        </>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">Enter a search term to explore the catalog.</p>
      )}
    </section>
  );
}
