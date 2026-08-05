import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchNewestContent } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Newest",
  description: "Latest content on manuelaX.",
};

export default async function NewestPage() {
  const items = await fetchNewestContent();
  return (
    <CatalogGridPage
      title="Newest"
      description={`${items.length} latest uploads`}
      items={items}
    />
  );
}
