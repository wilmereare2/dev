import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { PublicPromotion } from "@/components/promotions/promotion-card";
import type { PublicMemberPost } from "@/components/promotions/member-post-card";
import { formatRelativeDate } from "@/utils/format";

export type PromotionListEntry =
  | { kind: "post"; publishedAt: string; item: PublicMemberPost }
  | { kind: "campaign"; publishedAt: string; item: PublicPromotion };

function monetizationLabel(entry: PromotionListEntry) {
  if (entry.kind === "campaign") {
    const parts: string[] = [];
    if (entry.item.discountPercent != null) parts.push(`${entry.item.discountPercent}% off`);
    if (entry.item.couponCode) parts.push(entry.item.couponCode);
    return parts.length ? parts.join(" · ") : "Offer";
  }

  const parts: string[] = [];
  if (entry.item.ppvPriceCents != null && entry.item.ppvPriceCents > 0) {
    parts.push(`PPV $${(entry.item.ppvPriceCents / 100).toFixed(2)}`);
  }
  if (entry.item.isPremium) parts.push("Premium");
  return parts.length ? parts.join(" · ") : "Free";
}

function ownerLabel(entry: PromotionListEntry) {
  if (entry.kind === "campaign") {
    if (entry.item.owner?.type === "creator") return entry.item.owner.name ?? "Creator";
    if (entry.item.owner?.type === "business") return entry.item.owner.name;
    return "Member";
  }
  return entry.item.creator.name ?? "Creator";
}

function visibilityLabel(entry: PromotionListEntry) {
  if (entry.kind === "campaign") return "Public";
  return entry.item.visibility;
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

export function PromotionsStandardList({ entries }: { entries: PromotionListEntry[] }) {
  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-border bg-surface/60 p-8 text-center text-sm text-muted-foreground">
        Nothing live yet. Approve a creator upload in Admin → Content moderation, or a coupon campaign in
        Admin → Promotions.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="hidden px-4 py-3 sm:table-cell">Creator</th>
            <th className="px-4 py-3">Type</th>
            <th className="hidden px-4 py-3 md:table-cell">Visibility</th>
            <th className="hidden px-4 py-3 lg:table-cell">Monetization</th>
            <th className="hidden px-4 py-3 xl:table-cell">Published</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const href =
              entry.kind === "post"
                ? `/posts/${entry.item.id}`
                : entry.item.externalUrl ??
                  (entry.item.owner?.type === "creator" && entry.item.owner.slug
                    ? `/creator/${entry.item.owner.slug}`
                    : null);
            const external = entry.kind === "campaign" && Boolean(entry.item.externalUrl);

            return (
              <tr key={`${entry.kind}-${entry.item.id}`} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.item.title}</div>
                  {"body" in entry.item && entry.item.body ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.item.body}</p>
                  ) : null}
                  {"description" in entry.item && entry.item.description ? (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.item.description}</p>
                  ) : null}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">{ownerLabel(entry)}</td>
                <td className="px-4 py-3 capitalize">
                  {entry.kind === "campaign" ? "Campaign" : entry.item.mediaType}
                </td>
                <td className="hidden px-4 py-3 capitalize md:table-cell">{visibilityLabel(entry)}</td>
                <td className="hidden px-4 py-3 lg:table-cell">{monetizationLabel(entry)}</td>
                <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                  {formatRelativeDate(entry.publishedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {href ? (
                    external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        View
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <Link href={href} className="text-accent hover:underline">
                        View
                      </Link>
                    )
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
