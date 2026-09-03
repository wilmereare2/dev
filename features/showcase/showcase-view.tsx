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
      <div className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 lg:px-8">
        <AdSlot placement="listing" className="mt-2" />
      </div>
    </>
  );
}
