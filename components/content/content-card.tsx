import Link from "next/link";
import { Crown, Play } from "lucide-react";
import { SanityImage } from "@/components/media/sanity-image";
import { sanityImageUrl } from "@/lib/sanity/image";
import { encodeRouteParam } from "@/lib/site/route-params";
import type { SanityContentCard } from "@/types/sanity-content";import { formatDuration } from "@/utils/format";
import { cn } from "@/lib/utils";

type ContentCardProps = {
  item: SanityContentCard;
  priority?: boolean;
  className?: string;
  size?: "default" | "large";
};

export function ContentCard({ item, priority, className, size = "default" }: ContentCardProps) {
  const imageUrl = sanityImageUrl(item.thumbnail, size === "large" ? 1200 : 640);
  const duration = formatDuration(item.durationSeconds);

  return (
    <Link
      href={`/content/${encodeRouteParam(item.slug)}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-border/50 bg-surface/40 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-accent/10",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[16/10] w-full overflow-hidden bg-muted",
          size === "large" && "aspect-[21/9] sm:aspect-[2.4/1]",
        )}
      >
        {imageUrl ? (
          <SanityImage
            src={imageUrl}
            alt={item.title}
            fill
            priority={priority}
            sizes={size === "large" ? "100vw" : "(max-width:768px) 50vw, 25vw"}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/90 text-accent-foreground shadow-lg backdrop-blur-sm">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </div>
        {duration ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {duration}
          </span>
        ) : null}
        {item.featured ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-accent/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
            <Crown className="size-3" />
            Featured
          </span>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
          {item.title}
        </h3>
        {item.creators?.length ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.creators.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}

/** Visual slot before CMS content exists — keeps the grid feeling full. */
export function ContentCardSkeleton({ label }: { label?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface/30">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-accent/10 via-muted/50 to-background">
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-[length:200%_100%]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <Play className="size-8 text-muted-foreground/50" />
          {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-2 w-1/2 rounded bg-muted/70" />
      </div>
    </div>
  );
}
