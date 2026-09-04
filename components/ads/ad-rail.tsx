"use client";

import { AdSlot } from "@/components/ads/ad-slot";
import { cn } from "@/lib/utils";

/**
 * Right-hand advertising rail.
 *
 * Only present from `xl` up. The main grid already needs ~1024px for its own
 * content, so introducing a 300px rail below `xl` would squeeze the content
 * column the same way the auth split did before it was moved to `xl`.
 *
 * Each slot collapses when it has no ad, so a partly-sold rail leaves no gaps,
 * and the whole rail disappears when nothing is booked.
 */
export function AdRail({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Advertisements"
      className={cn(
        "hidden w-[300px] shrink-0 xl:block",
        // Sticks alongside the feed while the content column scrolls.
        "sticky top-[calc(var(--site-header-offset)+1rem)] self-start",
        className,
      )}
    >
      <div className="flex max-h-[calc(100dvh-var(--site-header-offset)-2rem)] flex-col gap-4 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AdSlot placement="sidebar_tall" collapseWhenEmpty />
        <AdSlot placement="sidebar_1" collapseWhenEmpty />
        <AdSlot placement="sidebar_2" collapseWhenEmpty />
        <AdSlot placement="sidebar_3" collapseWhenEmpty />
      </div>
    </aside>
  );
}
