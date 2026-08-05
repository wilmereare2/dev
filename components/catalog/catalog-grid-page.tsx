import Link from "next/link";
import { Clock } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "@/components/content/content-card";
import { Button } from "@/components/ui/button";
import type { SanityContentCard } from "@/types/sanity-content";

type CatalogGridPageProps = {
  title: string;
  description?: string;
  items: SanityContentCard[];
  emptyMessage?: string;
};

export function CatalogGridPage({ title, description, items, emptyMessage }: CatalogGridPageProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2 text-secondary">{description}</p> : null}
      {!items.length ? (
        <p className="mt-2 flex items-center gap-2 text-secondary">
          <Clock className="size-4 text-accent" aria-hidden />
          {emptyMessage ?? "No content published yet."}
        </p>
      ) : null}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.length
          ? items.map((item) => <ContentCard key={item._id} item={item} />)
          : Array.from({ length: 6 }).map((_, i) => <ContentCardSkeleton key={i} label="Coming soon" />)}
      </div>
      {!items.length ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <Button asChild variant="secondary">
            <Link href="/explore">Browse explore</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
