import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/content/content-card";
import { ContentActions } from "@/components/content/content-actions";
import { ContentPlayer } from "@/components/content/content-player";
import { AdSlot } from "@/components/ads/ad-slot";
import { ReportContentForm } from "@/features/content/report-content-form";
import { ContentComments } from "@/features/content/content-comments";
import { SanityImage } from "@/components/media/sanity-image";
import { auth } from "@/lib/auth/auth";
import { userHasActiveSubscription } from "@/lib/auth/entitlements";
import { fetchContentBySlug, fetchExploreContent } from "@/services/sanity/content";
import { getWatchProgressMs } from "@/services/user/library";
import { encodeRouteParam } from "@/lib/site/route-params";
import { sanityImageUrl } from "@/lib/sanity/image";
import { formatDuration } from "@/lib/format";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchContentBySlug(slug);
  if (!item) return { title: "Content" };
  return {
    title: item.title,
    description: item.synopsis,
  };
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // The item, the viewer's session, and the related rail are independent —
  // fetch them together instead of chaining four round trips.
  const [item, session, exploreContent] = await Promise.all([
    fetchContentBySlug(slug),
    auth(),
    fetchExploreContent(),
  ]);
  if (!item) notFound();

  const userId = session?.user?.id;

  const [hasSubscription, initialProgressMs] = userId
    ? await Promise.all([userHasActiveSubscription(userId), getWatchProgressMs(userId, item._id)])
    : [false, 0];

  const thumb = sanityImageUrl(item.thumbnail, 1400);
  const duration = formatDuration(item.durationSeconds);
  const related = exploreContent.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <div className="pb-8 sm:pb-16">
      <section className="relative border-b border-border/40">
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="relative aspect-video overflow-hidden bg-black sm:mx-0 sm:rounded-2xl sm:border sm:border-border/50 sm:shadow-2xl">
            {item.playbackUrl || item.streamAssetId ? (
              <ContentPlayer
                contentId={item._id}
                slug={item.slug}
                playbackUrl={item.playbackUrl}
                poster={thumb ?? undefined}
                signedIn={Boolean(userId)}
                initialProgressMs={initialProgressMs}
                isPremium={Boolean((item as { isPremium?: boolean }).isPremium)}
                hasSubscription={hasSubscription}
              />
            ) : thumb ? (
              <SanityImage src={thumb} alt={item.title} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-muted-foreground sm:min-h-[240px]">
                Add a video URL or file in Sanity Studio
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">{item.title}</h1>
            {item.creators?.length ? (
              <p className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                {item.creators.map((c, i) => (
                  <span key={c._id}>
                    {i > 0 ? <span className="text-border"> · </span> : null}
                    <Link href={`/creator/${encodeRouteParam(c.slug)}`} className="text-accent hover:underline">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          {duration ? (
            <span className="w-fit shrink-0 rounded-lg border border-border bg-surface/60 px-3 py-1 text-sm">{duration}</span>
          ) : null}
        </div>
        {item.synopsis ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">{item.synopsis}</p>
        ) : null}
        <AdSlot placement="in_content" className="mt-6" />
        <div className="mt-4 sm:mt-6">
          <ContentActions contentId={item._id} signedIn={Boolean(userId)} />
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 sm:mt-8 sm:p-5">
          <h2 className="text-sm font-semibold">Report content</h2>
          <div className="mt-4">
            <ReportContentForm contentId={item._id} signedIn={Boolean(userId)} />
          </div>
        </div>
        <ContentComments contentId={item._id} />
        {item.categories?.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {item.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${encodeRouteParam(cat.slug)}`}
                className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium hover:border-accent/50"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {related.length ? (
        <section className="pb-4">
          <h2 className="mb-4 font-display text-lg font-semibold sm:text-xl">More like this</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((r) => (
              <ContentCard key={r._id} item={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
