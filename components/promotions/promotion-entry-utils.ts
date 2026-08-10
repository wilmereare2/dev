import type { PublicPromotion } from "@/components/promotions/promotion-card";
import type { PublicMemberPost } from "@/components/promotions/member-post-card";

export type PromotionListEntry =
  | { kind: "post"; publishedAt: string; item: PublicMemberPost }
  | { kind: "campaign"; publishedAt: string; item: PublicPromotion };

export function entryMonetization(entry: PromotionListEntry) {
  if (entry.kind === "campaign") {
    const tags: string[] = [];
    if (entry.item.discountPercent != null) tags.push(`${entry.item.discountPercent}% off`);
    if (entry.item.couponCode) tags.push(entry.item.couponCode);
    return { price: null as string | null, tags: tags.length ? tags : ["Offer"] };
  }

  const tags: string[] = [];
  let price: string | null = null;
  if (entry.item.ppvPriceCents != null && entry.item.ppvPriceCents > 0) {
    price = `$${(entry.item.ppvPriceCents / 100).toFixed(2)}`;
    tags.push("PPV");
  }
  if (entry.item.isPremium) tags.push("Premium");
  if (!price && tags.length === 0) tags.push("Free");

  return { price, tags };
}

export function entryOwner(entry: PromotionListEntry) {
  if (entry.kind === "campaign") {
    if (entry.item.owner?.type === "creator") return entry.item.owner.name ?? "Creator";
    if (entry.item.owner?.type === "business") return entry.item.owner.name ?? "Business";
    return "Member";
  }
  return entry.item.creator.name ?? "Creator";
}

export function entryVisibility(entry: PromotionListEntry) {
  if (entry.kind === "campaign") return "public";
  return entry.item.visibility;
}

export function entryHref(entry: PromotionListEntry) {
  if (entry.kind === "post") return `/posts/${entry.item.id}`;
  if (entry.item.externalUrl) return entry.item.externalUrl;
  if (entry.item.owner?.type === "creator" && entry.item.owner.slug) {
    return `/creator/${entry.item.owner.slug}`;
  }
  return null;
}

export function isExternalEntry(entry: PromotionListEntry) {
  return entry.kind === "campaign" && Boolean(entry.item.externalUrl);
}

export function buildPromotionListEntries(
  posts: PublicMemberPost[],
  campaigns: PublicPromotion[],
): PromotionListEntry[] {
  return [
    ...posts.map((item) => ({
      kind: "post" as const,
      publishedAt: item.publishedAt,
      item,
    })),
    ...campaigns.map((item) => ({
      kind: "campaign" as const,
      publishedAt: item.publishedAt,
      item,
    })),
  ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
