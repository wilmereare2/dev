import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchTrendingContent } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Trending",
  description: "Trending content on manuelaX.",
};

export default async function TrendingPage() {
  const items = await fetchTrendingContent();
  return (
    <CatalogGridPage
      title="Trending"
      description={`${items.length} trending titles`}
      items={items}
      emptyMessage="Trending picks appear as editors feature new releases."
    />
  );
}
