import type { Metadata } from "next";
import Link from "next/link";
import {
  PromotionsStandardList,
  buildPromotionListEntries,
} from "@/components/promotions/promotions-standard-list";
import { APP_NAME } from "@/lib/constants";
import { listActivePromotions, mapPublicPromotion } from "@/services/creator/promotions";
import { listPublishedMemberPosts } from "@/services/creator/uploads";

export const metadata: Metadata = {
  title: "Member promotions",
  description: `Deals, coupons, and approved member posts on ${APP_NAME}.`,
};

export default async function PromotionsPage() {
  const [promotionRecords, memberPosts] = await Promise.all([
    listActivePromotions(),
    listPublishedMemberPosts(),
  ]);
  const promotions = promotionRecords.map(mapPublicPromotion);
  const entries = buildPromotionListEntries(memberPosts, promotions);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Member promotions
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Deals &amp; member posts
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Approved creator uploads and coupon campaigns, listed newest first. Posts marked{" "}
        <strong className="text-foreground">Followers</strong> or{" "}
        <strong className="text-foreground">Subscribers</strong> appear here after moderation; access rules
        apply on the post page.
      </p>

      <p className="mt-4 text-sm text-muted-foreground">{entries.length} live items</p>

      <div className="mt-6">
        <PromotionsStandardList entries={entries} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Creators can submit coupon campaigns from{" "}
        <Link href="/creator-dashboard/promotions" className="text-accent hover:underline">
          Creator dashboard → Promotions
        </Link>
        .
      </p>
    </section>
  );
}
