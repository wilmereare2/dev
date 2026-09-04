import { AdSlot } from "@/components/ads/ad-slot";
import { AdRail } from "@/components/ads/ad-rail";
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
    <div className="flex w-full items-start gap-6 xl:gap-8">
      {/*
        The content column is a query container, so the card grid responds to
        the width it actually has rather than to the viewport. Without that, the
        rail would steal 300px while the grid still drew four viewport-sized
        columns.
      */}
      <div className="@container min-w-0 flex-1">
        <ShowcaseGallery
          items={items}
          categories={categories}
          title={title}
          description={description}
          emptyMessage={emptyMessage}
          activeTab={activeTab}
        />

        <div className="w-full pb-10">
          <AdSlot placement="between_sections" collapseWhenEmpty className="mt-6" />
          <AdSlot placement="listing" collapseWhenEmpty className="mt-2" />
        </div>
      </div>

      <AdRail />
    </div>
  );
}
