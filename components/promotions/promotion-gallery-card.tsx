import Link from "next/link";
import { Crown, Eye, ExternalLink, Heart, Sparkles, Tag } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Badge, visibilityBadgeVariant } from "@/components/ui/badge";
import type { PromotionListEntry } from "@/components/promotions/promotion-entry-utils";
import {
  entryHref,
  entryMonetization,
  entryOwner,
  entryVisibility,
  isExternalEntry,
} from "@/components/promotions/promotion-entry-utils";
import {
  estimateContentLikes,
  estimateContentViews,
  formatCompactNumber,
  formatRelativeDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type PromotionGalleryCardProps = {
  entry: PromotionListEntry;
  priority?: boolean;
};

function previewUrl(entry: PromotionListEntry) {
  if (entry.kind === "post") {
    return entry.item.thumbnailUrl ?? (entry.item.mediaType === "photo" ? entry.item.mediaUrl : null);
  }
  return entry.item.bannerUrl ?? null;
}

function secondaryLine(entry: PromotionListEntry) {
  if (entry.kind === "post") {
    const parts = [entry.item.mediaType];
    if (entry.item.categories?.[0]) parts.push(entry.item.categories[0]);
    return parts.join(" · ");
  }
  if (entry.item.discountPercent != null) return `${entry.item.discountPercent}% off`;
  if (entry.item.couponCode) return `Code ${entry.item.couponCode}`;
  return "Promotion";
}

export function PromotionGalleryCard({ entry, priority }: PromotionGalleryCardProps) {
  const href = entryHref(entry);
  const external = isExternalEntry(entry);
  const monetization = entryMonetization(entry);
  const visibility = entryVisibility(entry);
  const owner = entryOwner(entry);
  const imageSrc = previewUrl(entry);
  const relativeDate = formatRelativeDate(entry.publishedAt);

  const views =
    entry.kind === "post"
      ? formatCompactNumber(estimateContentViews(entry.item.id, entry.publishedAt))
      : null;
  const likes =
    entry.kind === "post"
      ? formatCompactNumber(estimateContentLikes(entry.item.id, entry.publishedAt))
      : null;

  const cardClass = cn(
    "group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-surface/50",
    "transition duration-200 ease-out",
    href && "hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/25",
  );

  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/15 via-muted/60 to-background">
            {entry.kind === "campaign" ? (
              entry.item.discountPercent != null ? (
                <p className="font-display text-3xl font-semibold text-accent">{entry.item.discountPercent}%</p>
              ) : (
                <Tag className="size-10 text-accent/70" aria-hidden />
              )
            ) : (
              <Sparkles className="size-10 text-accent/60" aria-hidden />
            )}
          </div>
        )}

        {views ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Eye className="size-3 opacity-90" aria-hidden />
            {views}
          </span>
        ) : entry.kind === "campaign" ? (
          <span className="absolute left-2.5 top-2.5 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Offer
          </span>
        ) : null}

        <div className="absolute right-2.5 top-2.5 flex flex-wrap justify-end gap-1">
          {entry.kind === "post" && entry.item.isPremium ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              <Crown className="size-2.5" aria-hidden />
              Pro
            </span>
          ) : null}
          {monetization.price ? (
            <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {monetization.price}
            </span>
          ) : null}
        </div>

        {entry.kind === "post" ? (
          <span className="absolute bottom-2 left-2.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm">
            {entry.item.mediaType}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {entry.item.title}
        </h3>

        <div className="flex min-w-0 items-center gap-2">
          {entry.kind === "post" ? (
            <UserAvatar name={entry.item.creator.name} email={null} image={entry.item.creator.image} size="sm" />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              AD
            </span>
          )}
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground/90">By {owner}</span>
            <span> · {secondaryLine(entry)}</span>
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-0.5">
          <Badge variant={visibilityBadgeVariant(visibility)} className="text-[10px]">
            {visibility}
          </Badge>
          {monetization.tags.map((tag) => (
            <Badge
              key={tag}
              variant={tag === "Premium" ? "premium" : tag === "PPV" ? "ppv" : tag === "Offer" ? "accent" : "default"}
              className="text-[10px]"
            >
              {tag}
            </Badge>
          ))}
          {likes ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Heart className="size-3.5 opacity-70" aria-hidden />
              {likes}
            </span>
          ) : null}
          {relativeDate ? (
            <span className="text-[11px] text-muted-foreground">{relativeDate}</span>
          ) : null}
          {external ? (
            <ExternalLink className="ml-auto size-3.5 text-muted-foreground opacity-70" aria-hidden />
          ) : null}
        </div>
      </div>
    </>
  );

  if (!href) {
    return <article className={cardClass}>{body}</article>;
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cardClass}>
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={cardClass}>
      {body}
    </Link>
  );
}
