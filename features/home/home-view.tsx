"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "@/components/content/content-card";
import { CategoryPill, CreatorChip, SectionHeader } from "@/components/content/content-sections";
import { HomeLaunchSections } from "@/features/home/home-launch-sections";
import { Button } from "@/components/ui/button";
import { SanityImage } from "@/components/media/sanity-image";
import type { SanityHomePayload } from "@/types/sanity-content";
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

  return (
    <div className="pb-10">
      {/* Hero — compact before content; cinematic when catalog exists */}
      <section
        className={`relative overflow-hidden border-b border-border/60 ${
          hasContent ? "min-h-0" : "min-h-0"
        }`}
      >
        <div className="absolute inset-0">
          <SanityImage
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover opacity-40"
            fallbackClassName="opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/50" />
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
              transition={{ delay: 0.15 }}
              className={`mt-6 flex flex-wrap gap-3 ${hasContent ? "" : "justify-center lg:justify-start"}`}
            >
              <Button asChild size="lg">
                <Link href="/explore">
                  {hasContent ? "Browse library" : "Preview explore"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Creator applications</Link>
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

      {/* Pre-launch body — replaces empty void */}
      {!hasContent ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <HomeLaunchSections />
        </section>
      ) : null}

      {/* Categories */}
      {(hasContent || data.categories.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeader title="Categories" href="/categories" />
          {data.categories.length ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {data.categories.map((cat) => (
                <CategoryPill key={cat._id} category={cat} className="shrink-0" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Categories appear as editors publish in Studio.</p>
          )}
        </section>
      )}

      {/* Latest grid */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionHeader
          title={hasContent ? "Latest releases" : "Upcoming releases"}
          href={hasContent ? "/newest" : undefined}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {hasContent ? (
            data.latest.map((item, i) => <ContentCard key={item._id} item={item} priority={i < 4} />)
          ) : (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <ContentCardSkeleton key={i} label="Coming soon" />
              ))}
              <div className="col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface/80 p-6 sm:col-span-3 lg:col-span-4">
                <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                  Premium creator content is on the way.{" "}
                  <span className="text-foreground">New creators are joining every week.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Creators */}
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
