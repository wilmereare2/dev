import { ShowcaseView } from "@/features/showcase/showcase-view";
import type { SanityCategoryCard, SanityContentCard } from "@/types/sanity-content";

type CatalogGridPageProps = {
  title: string;
  description?: string;
  items: SanityContentCard[];
  categories?: SanityCategoryCard[];
  emptyMessage?: string;
  activeTab?: string;
};

export function CatalogGridPage({
  title,
  description,
  items,
  categories,
  emptyMessage,
  activeTab,
}: CatalogGridPageProps) {
  return (
    <ShowcaseView
      title={title}
      description={description ?? (items.length ? `${items.length} titles` : undefined)}
      items={items}
      categories={categories}
      emptyMessage={emptyMessage}
      activeTab={activeTab}
    />
  );
}
