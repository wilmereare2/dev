import type { Metadata } from "next";
import { ShowcaseGallery } from "@/components/showcase/showcase-gallery";
import { AdSlot } from "@/components/ads/ad-slot";
import { searchContent, fetchCategoriesIndex } from "@/services/sanity/catalog";
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
  const [items, categories] = await Promise.all([
    q ? searchContent(q) : Promise.resolve([]),
    fetchCategoriesIndex(),
  ]);

  if (!q) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-border/60 pb-5">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">Discover</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
          <p className="mt-2 text-sm text-muted-foreground">Find creators, titles, and categories</p>
          <div className="mt-5 max-w-md">
            <SearchForm />
          </div>
        </header>
        <p className="mt-10 text-sm text-muted-foreground">Enter a search term to explore the catalog.</p>
      </div>
    );
  }

  return (
    <>
      <ShowcaseGallery
        items={items}
        categories={categories}
        title="Search results"
        description={`${items.length} result${items.length === 1 ? "" : "s"} for “${q}”`}
        emptyMessage={`No results for “${q}”. Try another search term.`}
        activeTab="/explore"
        initialSearchQuery={q}
      />
      <div className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 lg:px-8">
        <AdSlot placement="listing" />
      </div>
    </>
  );
}
