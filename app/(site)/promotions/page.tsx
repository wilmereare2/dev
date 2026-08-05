import type { Metadata } from "next";
import Link from "next/link";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { MemberPostCard } from "@/components/promotions/member-post-card";
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
  const hasAnything = promotions.length > 0 || memberPosts.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Member promotions
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Deals &amp; member posts
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Coupon campaigns and moderator-approved creator uploads live here. Content uploads approved in{" "}
        <strong className="text-foreground">Content moderation</strong> appear below as member posts.
        Separate coupon campaigns are submitted from{" "}
        <strong className="text-foreground">Creator dashboard → Promotions</strong>.
      </p>

      {!hasAnything ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing live yet. Approve a creator upload in Admin → Content moderation, or a coupon campaign in
            Admin → Promotions.
          </p>
        </div>
      ) : null}

      {promotions.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Coupon campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">{promotions.length} live offers</p>
          <div className="mt-6 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </div>
      ) : null}

      {memberPosts.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Approved member posts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {memberPosts.length} published uploads from creators
          </p>
          <div className="mt-6 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {memberPosts.map((post) => (
              <MemberPostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ) : null}

      {memberPosts.length === 0 && promotions.length === 0 ? null : (
        <p className="mt-10 text-sm text-muted-foreground">
          Creators can submit coupon campaigns from{" "}
          <Link href="/creator-dashboard/promotions" className="text-accent hover:underline">
            Creator dashboard → Promotions
          </Link>
          .
        </p>
      )}
    </section>
  );
}
