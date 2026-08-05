import Link from "next/link";
import { BadgeCheck, Heart, Users, Video } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { SanityImage } from "@/components/media/sanity-image";
import { CreatorFollowButton } from "@/features/creator/creator-follow-button";
import { Button } from "@/components/ui/button";
import { sanityImageUrl } from "@/lib/sanity/image";
import type { CreatorPublicProfile } from "@/services/creator/public-profile";
import { formatCompactNumber } from "@/utils/format";

type CreatorProfileViewProps = {
  profile: CreatorPublicProfile;
};

export function CreatorProfileView({ profile }: CreatorProfileViewProps) {
  const avatar = sanityImageUrl(profile.avatar, 256);
  const subscriptionPrice =
    profile.subscriptionPriceCents != null
      ? `$${(profile.subscriptionPriceCents / 100).toFixed(2)}/mo`
      : null;

  return (
    <div className="pb-12">
      <div className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-rose-900/20 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="-mb-12 flex flex-col gap-6 sm:-mb-14 sm:flex-row sm:items-end">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl sm:size-32">
              {avatar ? (
                <SanityImage src={avatar} alt={profile.name} fill className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted text-3xl font-semibold">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  {profile.name}
                </h1>
                {profile.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    Verified
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-accent" aria-hidden />
                  {formatCompactNumber(profile.followerCount)} followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Video className="size-4 text-accent" aria-hidden />
                  {formatCompactNumber(profile.videoCount)} videos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="size-4 text-accent" aria-hidden />
                  {formatCompactNumber(profile.likeCount)} likes
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <CreatorFollowButton creatorUserId={profile.platformUserId} />
                <Button asChild variant="secondary">
                  <Link href="/pricing">
                    {subscriptionPrice ? `Subscribe · ${subscriptionPrice}` : "Subscribe"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <h2 className="font-display text-xl font-semibold tracking-tight">Videos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {profile.items.map((item) => (
                <ContentCard key={item._id} item={item} />
              ))}
            </div>
            {!profile.items.length ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No content linked yet. Assign this creator on Content documents in Studio.
              </p>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-sm">
              <h2 className="font-display text-lg font-semibold">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {profile.bio?.trim() ||
                  "This creator has not added a bio yet. Follow for updates when new releases go live."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-sm">
              <h2 className="font-display text-lg font-semibold">Support</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Subscribe for premium access or follow to see new uploads in your feed.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/contact">Contact creator support</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
