import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchTrendingContent, fetchCategoriesIndex } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Trending",
  description: "Trending content on manuelaX.",
};

export default async function TrendingPage() {
  const [items, categories] = await Promise.all([fetchTrendingContent(), fetchCategoriesIndex()]);
  return (
    <CatalogGridPage
      title="Trending"
      description={`${items.length} trending titles`}
      items={items}
      categories={categories}
      activeTab="/trending"
      emptyMessage="Trending picks appear as editors feature new releases."
    />
  );
}
