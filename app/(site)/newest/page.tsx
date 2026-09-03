import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchNewestContent, fetchCategoriesIndex } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Newest",
  description: "Latest content on manuelaX.",
};

export default async function NewestPage() {
  const [items, categories] = await Promise.all([fetchNewestContent(), fetchCategoriesIndex()]);
  return (
    <CatalogGridPage
      title="Newest"
      description={`${items.length} latest uploads`}
      items={items}
      categories={categories}
      activeTab="/newest"
    />
  );
}
