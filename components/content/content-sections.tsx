import Link from "next/link";
import { SanityImage } from "@/components/media/sanity-image";
import { sanityImageUrl } from "@/lib/sanity/image";
import { encodeRouteParam } from "@/lib/site/route-params";
import type { LaunchCategoryDefinition } from "@/lib/site/launch-categories";
import type { SanityCategoryCard, SanityCreatorCard } from "@/types/sanity-content";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      {href ? (
        <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function CategoryPill({
  category,
  className,
}: {
  category: SanityCategoryCard;
  className?: string;
}) {
  const cover = sanityImageUrl(category.coverImage, 120);

  return (
    <Link
      href={`/categories/${encodeRouteParam(category.slug)}`}
      className={cn(
        "group flex min-w-[140px] flex-col overflow-hidden rounded-xl border border-border/50 bg-surface/50 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10",
        className,
      )}
    >
      <div className="relative h-20 w-full bg-muted">
        {cover ? (
          <SanityImage src={cover} alt="" fill className="object-cover opacity-80 transition group-hover:opacity-100" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-2 left-2 text-sm font-semibold text-white">{category.title}</span>
      </div>
    </Link>
  );
}

export function LaunchCategoryPill({
  category,
  className,
  comingSoon = false,
}: {
  category: LaunchCategoryDefinition;
  className?: string;
  comingSoon?: boolean;
}) {
  return (
    <Link
      href={comingSoon ? "/explore" : `/categories/${encodeRouteParam(category.slug)}`}
      className={cn(
        "group flex min-w-[132px] shrink-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-surface/50 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10",
        className,
      )}
    >
      <div className={cn("relative flex h-20 w-full items-end bg-gradient-to-br p-3", category.tone)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="relative text-sm font-semibold text-white">{category.title}</span>
        {comingSoon ? (
          <span className="absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
            Soon
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function CreatorChip({ creator }: { creator: SanityCreatorCard }) {
  const avatar = sanityImageUrl(creator.avatar, 96);

  return (
    <Link
      href={`/creator/${encodeRouteParam(creator.slug)}`}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2"
    >
      <div className="relative size-16 overflow-hidden rounded-full border-2 border-border/60 ring-2 ring-transparent transition group-hover:border-accent group-hover:ring-accent/20">
        {avatar ? (
          <SanityImage src={avatar} alt={creator.name} fill className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
            {creator.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="line-clamp-2 text-center text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {creator.name}
      </span>
    </Link>
  );
}
