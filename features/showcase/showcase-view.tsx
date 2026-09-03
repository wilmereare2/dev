import { AdSlot } from "@/components/ads/ad-slot";
import { ShowcaseGallery } from "@/components/showcase/showcase-gallery";
import type { SanityCategoryCard, SanityContentCard } from "@/types/sanity-content";

type ShowcaseViewProps = {
  items: SanityContentCard[];
  categories?: SanityCategoryCard[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  activeTab?: string;
};

export function ShowcaseView({
  items,
  categories,
  title,
  description,
  emptyMessage,
  activeTab,
}: ShowcaseViewProps) {
  return (
    <>
      <ShowcaseGallery
        items={items}
        categories={categories}
        title={title}
        description={description}
        emptyMessage={emptyMessage}
        activeTab={activeTab}
      />
      <div className="w-full pb-10">
        <AdSlot placement="listing" className="mt-2" />
      </div>
    </>
  );
}
