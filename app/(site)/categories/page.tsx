import type { Metadata } from "next";
import { CatalogGridPage } from "@/components/catalog/catalog-grid-page";
import { fetchCategoriesIndex } from "@/services/sanity/catalog";
import Link from "next/link";
import { SanityImage } from "@/components/media/sanity-image";
import { sanityImageUrl } from "@/lib/sanity/image";
import { encodeRouteParam } from "@/lib/site/route-params";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse categories on manuelaX.",
};

export default async function CategoriesPage() {
  const categories = await fetchCategoriesIndex();

  if (!categories.length) {
    return (
      <CatalogGridPage
        title="Categories"
        description="Browse by category"
        items={[]}
        emptyMessage="Categories will appear once editors publish them in Studio."
      />
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Categories</h1>
      <p className="mt-2 text-secondary">{categories.length} categories</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const imageUrl = sanityImageUrl(category.coverImage, 800);
          return (
            <Link
              key={category._id}
              href={`/categories/${encodeRouteParam(category.slug)}`}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-surface/60 transition hover:border-accent/40"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {imageUrl ? (
                  <SanityImage src={imageUrl} alt={category.title} fill sizes="400px" className="object-cover" />
                ) : null}
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold">{category.title}</h2>
                {category.description ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
