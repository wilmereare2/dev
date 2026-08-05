import type { Metadata } from "next";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { APP_NAME } from "@/lib/constants";
import { listActivePromotions, mapPublicPromotion } from "@/services/creator/promotions";

export const metadata: Metadata = {
  title: "Member promotions",
  description: `Deals, coupons, and offers from creators and businesses on ${APP_NAME}.`,
};

export default async function PromotionsPage() {
  const records = await listActivePromotions();
  const promotions = records.map(mapPublicPromotion);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Member promotions
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Deals &amp; offers
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Approved promotions from verified creators and businesses. Only posts reviewed by moderators appear here.
      </p>

      {promotions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No live promotions yet. Check back after moderators approve member campaigns.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">{promotions.length} live promotions</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
