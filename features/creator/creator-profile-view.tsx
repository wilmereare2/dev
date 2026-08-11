import Link from "next/link";
import { BadgeCheck, Heart, Sparkles, Users, Video } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { SanityImage } from "@/components/media/sanity-image";
import { UserAvatar } from "@/components/user/user-avatar";
import { CreatorFollowButton } from "@/features/creator/creator-follow-button";
import { CreatorSupportActions } from "@/features/creator/creator-support-actions";
import { Button } from "@/components/ui/button";
import { sanityImageUrl } from "@/lib/sanity/image";
import type { CreatorPublicProfile } from "@/services/creator/public-profile";
import { formatCompactNumber } from "@/utils/format";

type CreatorProfileViewProps = {
  profile: CreatorPublicProfile;
  monetizationEnabled: boolean;
};

function StatPill({
  icon: Icon,
  label,
}: {
  icon: typeof Users;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
      <Icon className="size-4 shrink-0 text-accent" aria-hidden />
      {label}
    </span>
  );
}

export function CreatorProfileView({ profile, monetizationEnabled }: CreatorProfileViewProps) {
  const sanityAvatar = sanityImageUrl(profile.avatar, 512);
  const platformAvatar = profile.platformAvatar;
  const displayName = profile.name;

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-rose-950/35 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.18),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative shrink-0 self-start">
                {platformAvatar?.image ? (
                  <UserAvatar
                    name={platformAvatar.name ?? displayName}
                    email={null}
                    image={platformAvatar.image}
                    imageScale={platformAvatar.avatarScale}
                    imageFocusX={platformAvatar.avatarFocusX}
                    imageFocusY={platformAvatar.avatarFocusY}
                    className="size-28 border-4 border-background text-3xl shadow-2xl ring-2 ring-accent/20 sm:size-32"
                  />
                ) : sanityAvatar ? (
                  <div className="relative size-28 overflow-hidden rounded-full border-4 border-background shadow-2xl ring-2 ring-accent/20 sm:size-32">
                    <SanityImage src={sanityAvatar} alt={displayName} fill className="object-cover" />
                  </div>
                ) : (
                  <UserAvatar
                    name={displayName}
                    email={null}
                    image={null}
                    className="size-28 border-4 border-background text-3xl shadow-2xl ring-2 ring-accent/20 sm:size-32"
                  />
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
                  {profile.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                      <BadgeCheck className="size-3.5" aria-hidden />
                      Verified
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {profile.bio?.trim() ||
                    "Creator on manuelaX. Follow for new releases and exclusive content."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatPill
                    icon={Users}
                    label={`${formatCompactNumber(profile.followerCount)} followers`}
                  />
                  <StatPill icon={Video} label={`${formatCompactNumber(profile.videoCount)} videos`} />
                  <StatPill icon={Heart} label={`${formatCompactNumber(profile.likeCount)} likes`} />
                </div>
              </div>
            </div>

            {profile.platformUserId ? (
              <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                <CreatorFollowButton creatorUserId={profile.platformUserId} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Videos</h2>
            {profile.items.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                {profile.items.length} {profile.items.length === 1 ? "release" : "releases"}
              </span>
            ) : null}
          </div>

          {profile.items.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.items.map((item) => (
                <ContentCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface/30 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Sparkles className="size-7" aria-hidden />
              </div>
              <p className="mt-4 text-base font-medium text-foreground">No videos yet</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                This creator hasn&apos;t published content here yet. Follow to get notified when new releases go live.
              </p>
              {profile.platformUserId ? (
                <div className="mt-5">
                  <CreatorFollowButton creatorUserId={profile.platformUserId} />
                </div>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {profile.platformUserId ? (
            <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-sm">
              <h2 className="font-display text-lg font-semibold">Support</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {monetizationEnabled
                  ? "Subscribe, send a tip, or message this creator directly."
                  : "Message this creator directly. Paid support options open once checkout is configured."}
              </p>
              <div className="mt-4">
                <CreatorSupportActions
                  creatorUserId={profile.platformUserId}
                  subscriptionPriceCents={profile.subscriptionPriceCents ?? null}
                  monetizationEnabled={monetizationEnabled}
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-sm">
            <h2 className="font-display text-lg font-semibold">About</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {profile.bio?.trim() ||
                "This creator has not added a detailed bio yet. Check back soon for updates."}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 backdrop-blur-sm">
            <h2 className="font-display text-lg font-semibold">Need help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Questions about subscriptions or billing? Our team can help.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
