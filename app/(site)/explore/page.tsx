import type { Metadata } from "next";
import { ShowcaseView } from "@/features/showcase/showcase-view";
import { fetchExploreContent } from "@/services/sanity/content";
import { fetchCategoriesIndex } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse the premium creator catalog on manuelaX.",
};

export default async function ExplorePage() {
  const [items, categories] = await Promise.all([fetchExploreContent(), fetchCategoriesIndex()]);

  return (
    <ShowcaseView
      items={items}
      categories={categories}
      title="Explore"
      description="Discover exclusive releases from creators across the platform."
      emptyMessage="Premium creator content is coming soon — new releases every week."
      activeTab="/explore"
    />
  );
}
