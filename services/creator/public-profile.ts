import { prisma } from "@/lib/db/prisma";
import { sanityClient } from "@/lib/sanity/client";
import type { SanityContentCard } from "@/types/sanity-content";
import type { SanityImageSource } from "@sanity/image-url";

export type CreatorPublicProfile = {
  name: string;
  slug: string;
  bio?: string;
  avatar?: SanityImageSource;
  platformUserId?: string;
  verified: boolean;
  followerCount: number;
  videoCount: number;
  likeCount: number;
  subscriptionPriceCents?: number | null;
  items: SanityContentCard[];
};

export async function getCreatorPublicProfile(slug: string): Promise<CreatorPublicProfile | null> {
  if (!sanityClient) return null;

  const creator = await sanityClient.fetch<{
    _id: string;
    name: string;
    bio?: string;
    avatar?: SanityImageSource;
  } | null>(
    `*[_type == "creator" && slug.current == $slug][0]{ _id, name, bio, avatar }`,
    { slug },
    { next: { revalidate: 60 } },
  );

  if (!creator) return null;

  const items = await sanityClient.fetch<SanityContentCard[]>(
    `*[_type == "content" && references(*[_type=="creator" && slug.current==$slug]._id)] | order(publishedAt desc) {
      _id, title, "slug": slug.current, synopsis, durationSeconds, featured, isPremium, thumbnail, publishedAt, "creators": creators[]->name
    }`,
    { slug },
    { next: { revalidate: 60 } },
  );

  const platformProfile = await prisma.creatorProfile.findFirst({
    where: { sanityCreatorSlug: slug },
    select: {
      userId: true,
      verificationStatus: true,
      subscriptionPriceCents: true,
    },
  });

  const platformUserId = platformProfile?.userId;
  const contentIds = items.map((item) => item._id);

  const [followerCount, likeCount] = platformUserId
    ? await Promise.all([
        prisma.creatorFollow.count({ where: { creatorId: platformUserId } }),
        contentIds.length
          ? prisma.contentLike.count({ where: { contentId: { in: contentIds } } })
          : Promise.resolve(0),
      ])
    : [0, 0];

  return {
    name: creator.name,
    slug,
    bio: creator.bio,
    avatar: creator.avatar,
    platformUserId,
    verified: platformProfile?.verificationStatus === "approved",
    followerCount,
    videoCount: items.length,
    likeCount,
    subscriptionPriceCents: platformProfile?.subscriptionPriceCents,
    items,
  };
}
