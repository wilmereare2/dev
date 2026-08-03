import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity/client";
import { decodeRouteParam } from "@/lib/site/route-params";
import { sanityImageUrl } from "@/lib/sanity/image";
import { SanityImage } from "@/components/media/sanity-image";
import { ContentCard } from "@/components/content/content-card";
import type { SanityContentCard } from "@/types/sanity-content";
import type { SanityImageSource } from "@sanity/image-url";

async function fetchCreator(slug: string) {
  if (!sanityClient) return null;
  return sanityClient.fetch<{
    name: string;
    bio?: string;
    avatar?: SanityImageSource;
  } | null>(
    `*[_type == "creator" && slug.current == $slug][0]{ name, bio, avatar }`,
    { slug },
    { next: { revalidate: 60 } },
  );
}

async function fetchCreatorContent(slug: string): Promise<SanityContentCard[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch(
    `*[_type == "content" && references(*[_type=="creator" && slug.current==$slug]._id)] | order(publishedAt desc) {
      _id, title, "slug": slug.current, durationSeconds, thumbnail, featured, "creators": creators[]->name
    }`,
    { slug },
    { next: { revalidate: 60 } },
  );
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function CreatorPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  const creator = await fetchCreator(slug);
  if (!creator) notFound();

  const items = await fetchCreatorContent(slug);
  const avatar = sanityImageUrl(creator.avatar, 256);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative size-28 overflow-hidden rounded-full border-2 border-accent/40">
          {avatar ? (
            <SanityImage src={avatar} alt={creator.name} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-3xl font-semibold">
              {creator.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">{creator.name}</h1>
          {creator.bio ? <p className="mt-2 max-w-xl text-muted-foreground">{creator.bio}</p> : null}
          <Link href="/explore" className="mt-3 inline-block text-sm text-accent hover:underline">
            Back to explore
          </Link>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item._id} item={item} />
        ))}
      </div>
      {!items.length ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No content linked yet. Assign this creator on Content documents in Studio.
        </p>
      ) : null}
    </section>
  );
}
