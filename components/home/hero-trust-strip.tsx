import { Star } from "lucide-react";
import { SanityImage } from "@/components/media/sanity-image";
import { sanityImageUrl } from "@/lib/sanity/image";
import { formatCompactNumber } from "@/utils/format";
import type { SanityCreatorCard } from "@/types/sanity-content";

type HeroTrustStripProps = {
  creators: SanityCreatorCard[];
  videoCount: number;
  creatorCount: number;
};

export function HeroTrustStrip({ creators, videoCount, creatorCount }: HeroTrustStripProps) {
  const avatars = creators.slice(0, 4);
  const videosLabel = videoCount > 0 ? `${formatCompactNumber(videoCount)} videos` : "New releases weekly";
  const creatorsLabel =
    creatorCount > 0 ? `${formatCompactNumber(creatorCount)} creators` : "Creators joining now";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {avatars.length > 0 ? (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {avatars.map((creator) => {
              const avatar = sanityImageUrl(creator.avatar, 64);
              return (
                <div
                  key={creator._id}
                  className="relative size-9 overflow-hidden rounded-full border-2 border-background ring-1 ring-border/60"
                  title={creator.name}
                >
                  {avatar ? (
                    <SanityImage src={avatar} alt={creator.name} fill className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted text-xs font-semibold text-muted-foreground">
                      {creator.name.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <span className="ml-3 text-sm text-muted-foreground">
            {creatorsLabel} · {videosLabel}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{creatorsLabel} · {videosLabel}</p>
      )}

      <span className="hidden h-4 w-px bg-border/80 sm:block" aria-hidden />

      <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <span className="inline-flex text-amber-400" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-3.5 fill-current" />
          ))}
        </span>
        <span className="sr-only">Five star rating.</span>
        Premium · Privacy protected
      </p>
    </div>
  );
}
