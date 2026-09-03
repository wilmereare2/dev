import type { Metadata } from "next";
import Link from "next/link";
import { fetchTagsIndex } from "@/services/sanity/catalog";

export const metadata: Metadata = {
  title: "Tags",
  description: "Browse tags on manuelaX.",
};

export default async function TagsPage() {
  const tags = await fetchTagsIndex();

  return (
    <section className="w-full py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Tags</h1>
      <p className="mt-2 text-secondary">Faceted discovery by tag</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag) => (
            <Link
              key={tag._id}
              href={`/search?q=${encodeURIComponent(tag.title)}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition hover:border-accent/40 hover:text-accent"
            >
              {tag.title}
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Tags will appear once editors publish them in Studio.</p>
        )}
      </div>
    </section>
  );
}
