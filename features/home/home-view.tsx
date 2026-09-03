"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "@/components/content/content-card";
import {
  CategoryPill,
  CreatorChip,
  LaunchCategoryPill,
  SectionHeader,
} from "@/components/content/content-sections";
import { HeroTrustStrip } from "@/components/home/hero-trust-strip";
import { AdSlot } from "@/components/ads/ad-slot";
import { TrustBar } from "@/components/layout/trust-bar";
import { HomeLaunchSections } from "@/features/home/home-launch-sections";
import { Button } from "@/components/ui/button";
import { SanityImage } from "@/components/media/sanity-image";
import { LAUNCH_CATEGORY_PILLS, type LaunchCategoryDefinition } from "@/lib/site/launch-categories";
import type { SanityCategoryCard, SanityHomePayload } from "@/types/sanity-content";
import { sanityImageUrl } from "@/lib/sanity/image";

type HomeViewProps = {
  data: SanityHomePayload;
  defaults: {
    heroTitle: string;
    heroSubtitle: string;
    emptyHeroTitle: string;
    emptyHeroSubtitle: string;
  };
};

function buildCategoryRow(categories: SanityCategoryCard[]): Array<SanityCategoryCard | LaunchCategoryDefinition> {
  const cmsSlugs = new Set(categories.map((category) => category.slug));
  const fillers = LAUNCH_CATEGORY_PILLS.filter((pill) => !cmsSlugs.has(pill.slug));
  const merged = [...categories, ...fillers];
  return merged.slice(0, 8);
}

export function HomeView({ data, defaults }: HomeViewProps) {
  const hasContent = data.latest.length > 0;
  const heroTitle = hasContent
    ? data.settings?.homepageHeroTitle || defaults.heroTitle
    : data.settings?.homepageHeroTitle || defaults.emptyHeroTitle;
  const heroSubtitle = hasContent
    ? data.settings?.homepageHeroSubtitle || defaults.heroSubtitle
    : data.settings?.homepageHeroSubtitle || defaults.emptyHeroSubtitle;
  const featured = data.featured ?? data.latest[0] ?? null;
  const heroImage =
    sanityImageUrl(featured?.thumbnail, 1600) ??
    sanityImageUrl(data.settings?.seo?.ogImage, 1600);
  const videoCount = data.stats?.videoCount ?? data.latest.length;
  const creatorCount = data.stats?.creatorCount ?? data.creators.length;
  const categoryRow = buildCategoryRow(data.categories);
  const cmsSlugs = new Set(data.categories.map((category) => category.slug));

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0">
          <SanityImage
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover opacity-55"
            fallbackClassName="opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <div
          className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
            hasContent
              ? "grid gap-8 py-12 lg:grid-cols-2 lg:items-center lg:py-16"
              : "py-10 sm:py-12 lg:py-14"
          }`}
        >
          <div className={hasContent ? "" : "mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"}>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
            >
              <Sparkles className="size-3.5" />
              {hasContent ? "Premium · 18+" : "Launching soon · 18+"}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 max-w-xl text-base leading-relaxed text-secondary sm:text-lg lg:max-w-none"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <HeroTrustStrip
                creators={data.creators}
                videoCount={videoCount}
                creatorCount={creatorCount}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`mt-6 flex flex-wrap gap-3 ${hasContent ? "" : "justify-center lg:justify-start"}`}
            >
              <Button asChild size="lg" variant="premium">
                <Link href="/explore" className="group">
                  <Play className="size-4 fill-current" />
                  {hasContent ? "Browse library" : "Preview explore"}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Become a creator</Link>
              </Button>
            </motion.div>
          </div>

          {featured ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 }}
              className="hidden lg:block"
            >
              <ContentCard item={featured} size="large" priority />
            </motion.div>
          ) : null}
        </div>
      </section>

      <TrustBar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdSlot placement="homepage_top" className="mt-6" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeader title="Member promotions" href="/promotions" />
        <Link
          href="/promotions"
          className="mt-4 block rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/10 via-surface/50 to-surface/50 p-5 transition hover:border-accent/45 sm:p-6"
        >
          <p className="font-display text-lg font-semibold sm:text-xl">Deals &amp; offers channel</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Browse moderator-approved coupons, discounts, and campaigns from creators and businesses.
          </p>
        </Link>
      </section>

      {!hasContent ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <HomeLaunchSections />
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader title="Categories" href="/categories" />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categoryRow.map((entry) => {
            if ("_id" in entry) {
              return <CategoryPill key={entry._id} category={entry} className="shrink-0" />;
            }

            return (
              <LaunchCategoryPill
                key={entry.slug}
                category={entry}
                className="shrink-0"
                comingSoon={!cmsSlugs.has(entry.slug)}
              />
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <SectionHeader
              title={hasContent ? "Latest releases" : "Upcoming releases"}
              href={hasContent ? "/newest" : undefined}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3">
              {hasContent ? (
                data.latest.map((item, i) => <ContentCard key={item._id} item={item} priority={i < 4} />)
              ) : (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ContentCardSkeleton key={i} label="Coming soon" />
                  ))}
                  <div className="col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface/80 p-6 sm:col-span-3">
                    <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                      Premium creator content is on the way.{" "}
                      <span className="text-foreground">New creators are joining every week.</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <AdSlot placement="homepage_sidebar" />
          </div>
        </div>
      </section>

      {(hasContent || data.creators.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeader title="Creators" href="/explore" linkLabel="Explore" />
          {data.creators.length ? (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {data.creators.map((c) => (
                <CreatorChip key={c._id} creator={c} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {data.trending.length > 1 ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionHeader title="Trending now" href="/trending" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.trending.slice(0, 8).map((item) => (
              <ContentCard key={`t-${item._id}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
