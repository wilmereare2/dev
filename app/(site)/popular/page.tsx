import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchPopularContent } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Popular",
  description: "Popular content on manuelaX.",
};

export default async function PopularPage() {
  const items = await fetchPopularContent();
  return (
    <CatalogGridPage
      title="Popular"
      description={`${items.length} popular titles`}
      items={items}
    />
  );
}
