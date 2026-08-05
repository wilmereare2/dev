import Link from "next/link";
import { ExternalLink, Tag } from "lucide-react";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import type { mapPublicPromotion } from "@/services/creator/promotions";

export type PublicPromotion = ReturnType<typeof mapPublicPromotion>;

function formatExpires(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function PromotionCard({ promotion }: { promotion: PublicPromotion }) {
  const ownerName =
    promotion.owner?.type === "creator"
      ? promotion.owner.name ?? "Creator"
      : promotion.owner?.type === "business"
        ? promotion.owner.name
        : "Member";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-surface/60 shadow-sm transition hover:border-accent/40">
      {promotion.bannerUrl ? (
        <div className="relative aspect-[16/9] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={promotion.bannerUrl} alt="" className="h-full w-full object-cover" />
          {promotion.discountPercent != null ? (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {promotion.discountPercent}% off
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-accent/20 to-background/40 px-6 text-center">
          {promotion.discountPercent != null ? (
            <p className="font-display text-4xl font-semibold text-accent">{promotion.discountPercent}%</p>
          ) : (
            <Tag className="size-10 text-accent/70" aria-hidden />
          )}
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          {promotion.owner?.type === "creator" ? (
            <UserAvatar
              name={promotion.owner.name}
              email={null}
              image={promotion.owner.image}
              size="sm"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold leading-tight">{promotion.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">by {ownerName}</p>
          </div>
        </div>

        {promotion.body ? <p className="text-sm leading-relaxed text-muted-foreground">{promotion.body}</p> : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {promotion.couponCode ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-accent">
              {promotion.couponCode}
            </span>
          ) : null}
          {promotion.expiresAt ? <span>Expires {formatExpires(promotion.expiresAt)}</span> : null}
        </div>

        {promotion.externalUrl ? (
          <Button asChild variant="premium" size="sm">
            <a href={promotion.externalUrl} target="_blank" rel="noreferrer">
              View offer
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ) : promotion.owner?.type === "creator" && promotion.owner.slug ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/creator/${promotion.owner.slug}`}>View creator</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
