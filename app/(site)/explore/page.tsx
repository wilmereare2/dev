import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "@/components/content/content-card";
import { fetchExploreContent } from "@/services/sanity/content";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse the premium creator catalog on manuelaX.",
};

export default async function ExplorePage() {
  const items = await fetchExploreContent();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Explore</h1>
      {items.length ? (
        <p className="mt-2 text-secondary">{items.length} titles in catalog</p>
      ) : (
        <p className="mt-2 flex items-center gap-2 text-secondary">
          <Clock className="size-4 text-accent" aria-hidden />
          Premium creator content coming soon — new releases every week.
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.length
          ? items.map((item) => <ContentCard key={item._id} item={item} />)
          : Array.from({ length: 6 }).map((_, i) => (
              <ContentCardSkeleton key={i} label="Coming soon" />
            ))}
      </div>
      {!items.length ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The library is launching in phases. Return to the homepage for updates or apply to join as a
            creator.
          </p>
          <Button asChild className="mt-4" variant="secondary">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
