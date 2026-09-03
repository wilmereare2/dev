import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { decodeRouteParam } from "@/lib/site/route-params";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityImageUrl } from "@/lib/sanity/image";
import { SanityImage } from "@/components/media/sanity-image";
import { ContentCard } from "@/components/content/content-card";
import type { SanityContentCard } from "@/types/sanity-content";

async function fetchCategory(slug: string) {
  if (!sanityClient) return null;
  return sanityClient.fetch<{
    title: string;
    description?: string;
    coverImage?: unknown;
  } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ title, description, coverImage }`,
    { slug },
    { next: { revalidate: 60 } },
  );
}

async function fetchCategoryContent(slug: string): Promise<SanityContentCard[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    `*[_type == "content" && references(*[_type=="category" && slug.current==$slug]._id)] | order(publishedAt desc) {
      _id, title, "slug": slug.current, durationSeconds, thumbnail, featured, "creators": creators[]->name
    }`,
    { slug },
    { next: { revalidate: 60 } },
  );
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  const category = await fetchCategory(slug);
  if (!category) notFound();

  const items = await fetchCategoryContent(slug);
  const cover = sanityImageUrl(category.coverImage as SanityImageSource, 1200);

  return (
    <section className="pb-16">
      <div className="relative h-48 overflow-hidden border-b border-border/40 sm:h-56">
        {cover ? (
          <SanityImage src={cover} alt="" fill priority className="object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative flex h-full w-full items-end pb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{category.title}</h1>
            {category.description ? (
              <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
}
