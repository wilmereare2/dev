import type { Metadata } from "next";
import { PromotionsHub } from "@/components/promotions/promotions-hub";
import { buildPromotionListEntries } from "@/components/promotions/promotion-entry-utils";
import { APP_NAME } from "@/lib/constants";
import { listActivePromotions, mapPublicPromotion } from "@/services/creator/promotions";
import { listPublishedMemberPosts } from "@/services/creator/uploads";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Member promotions",
  description: `Deals, coupons, and approved member posts on ${APP_NAME}.`,
};

export default async function PromotionsPage() {
  let promotionRecords: Awaited<ReturnType<typeof listActivePromotions>> = [];
  let memberPosts: Awaited<ReturnType<typeof listPublishedMemberPosts>> = [];

  try {
    [promotionRecords, memberPosts] = await Promise.all([
      listActivePromotions(),
      listPublishedMemberPosts(),
    ]);
  } catch {
    promotionRecords = [];
    memberPosts = [];
  }

  const promotions = promotionRecords.map(mapPublicPromotion);
  const entries = buildPromotionListEntries(memberPosts, promotions);

  return <PromotionsHub entries={entries} />;
}
