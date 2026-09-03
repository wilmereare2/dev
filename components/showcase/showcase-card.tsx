import Link from "next/link";
import { Crown, Eye, Heart } from "lucide-react";
import { SanityImage } from "@/components/media/sanity-image";
import { sanityImageUrl } from "@/lib/sanity/image";
import { encodeRouteParam } from "@/lib/site/route-params";
import type { SanityContentCard } from "@/types/sanity-content";
import {
  estimateContentLikes,
  estimateContentViews,
  formatCompactNumber,
  formatDuration,
  formatRelativeDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type ShowcaseCardProps = {
  item: SanityContentCard;
  priority?: boolean;
  className?: string;
};

function creatorLabel(item: SanityContentCard) {
  const profile = item.creatorProfiles?.[0];
  if (profile?.name) return profile.name;
  return item.creators?.[0] ?? null;
}

function secondaryLabel(item: SanityContentCard) {
  const category = item.categories?.[0]?.title;
  if (category) return category;
  return formatRelativeDate(item.publishedAt);
}

function creatorInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ShowcaseCard({ item, priority, className }: ShowcaseCardProps) {
  const imageUrl = sanityImageUrl(item.thumbnail, 800);
  const views = formatCompactNumber(estimateContentViews(item._id, item.publishedAt));
  const likes = formatCompactNumber(estimateContentLikes(item._id, item.publishedAt));
  const duration = formatDuration(item.durationSeconds);
  const creator = creatorLabel(item);
  const secondary = secondaryLabel(item);
  const avatar = item.creatorProfiles?.[0]?.avatar;
  const avatarUrl = sanityImageUrl(avatar, 96);

  return (
    <Link
      href={`/content/${encodeRouteParam(item.slug)}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-surface/50",
        "transition duration-200 ease-out",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/25",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <SanityImage
            src={imageUrl}
            alt={item.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-muted/60 to-background" />
        )}

        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <Eye className="size-3 opacity-90" aria-hidden />
          {views}
        </span>

        {item.isPremium ? (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-0.5 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
            <Crown className="size-2.5" aria-hidden />
            Pro
          </span>
        ) : null}

        {duration ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {duration}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.title}
        </h3>

        {creator || secondary ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-[10px] font-semibold text-muted-foreground">
              {avatarUrl ? (
                <SanityImage src={avatarUrl} alt="" fill className="object-cover" />
              ) : creator ? (
                creatorInitials(creator)
              ) : (
                "?"
              )}
            </span>
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {creator ? (
                <>
                  <span className="font-medium text-foreground/90">By {creator}</span>
                  {secondary ? <span> · {secondary}</span> : null}
                </>
              ) : (
                secondary
              )}
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-3 pt-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5 opacity-70" aria-hidden />
            {likes}
          </span>
          {item.featured ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
              Featured
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ShowcaseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/30">
      <div className="aspect-[4/3] animate-pulse bg-muted/60" />
      <div className="space-y-2 px-3 py-3">
        <div className="h-4 w-[88%] rounded bg-muted" />
        <div className="h-3 w-[65%] rounded bg-muted/70" />
        <div className="h-3 w-12 rounded bg-muted/60" />
      </div>
    </div>
  );
}
