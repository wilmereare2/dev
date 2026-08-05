import { prisma } from "@/lib/db/prisma";
import { fetchExploreContent } from "@/services/sanity/content";
import type { SanityContentCard } from "@/types/sanity-content";

export async function getPersonalizedRecommendations(userId?: string, limit = 12) {
  const catalog = await fetchExploreContent();
  if (!catalog.length) return [];

  if (!userId) {
    return catalog.slice(0, limit);
  }

  const [history, likes, follows] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      take: 20,
    }),
    prisma.contentLike.findMany({ where: { userId }, take: 20 }),
    prisma.creatorFollow.findMany({ where: { userId }, take: 20 }),
  ]);

  const watchedIds = new Set(history.map((entry) => entry.contentId));
  const likedIds = new Set(likes.map((entry) => entry.contentId));
  const followedCreators = new Set(follows.map((entry) => entry.creatorId));

  const scored = catalog
    .filter((item) => !watchedIds.has(item._id))
    .map((item) => {
      let score = item.featured ? 2 : 0;
      if (likedIds.has(item._id)) score += 3;
      if (item.creators?.some((creator) => followedCreators.has(creator))) score += 4;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || (b.item.publishedAt ?? "").localeCompare(a.item.publishedAt ?? ""));

  return scored.slice(0, limit).map(({ item }) => item) as SanityContentCard[];
}
