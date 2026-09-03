import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchPopularContent, fetchCategoriesIndex } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Popular",
  description: "Popular content on manuelaX.",
};

export default async function PopularPage() {
  const [items, categories] = await Promise.all([fetchPopularContent(), fetchCategoriesIndex()]);
  return (
    <CatalogGridPage
      title="Popular"
      description={`${items.length} popular titles`}
      items={items}
      categories={categories}
      activeTab="/popular"
    />
  );
}
