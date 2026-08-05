import { prisma } from "@/lib/db/prisma";

export async function listBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleBookmark(userId: string, contentId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.bookmark.create({ data: { userId, contentId } });
  return { saved: true };
}

export async function listWatchLater(userId: string) {
  return prisma.watchLater.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleWatchLater(userId: string, contentId: string) {
  const existing = await prisma.watchLater.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (existing) {
    await prisma.watchLater.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.watchLater.create({ data: { userId, contentId } });
  return { saved: true };
}

export async function listWatchHistory(userId: string, limit = 50) {
  return prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    take: limit,
  });
}

export async function upsertWatchProgress(userId: string, contentId: string, progressMs: number) {
  const existing = await prisma.watchHistory.findFirst({
    where: { userId, contentId },
    orderBy: { watchedAt: "desc" },
  });

  if (existing) {
    return prisma.watchHistory.update({
      where: { id: existing.id },
      data: { progressMs, watchedAt: new Date() },
    });
  }

  return prisma.watchHistory.create({
    data: { userId, contentId, progressMs },
  });
}

export async function toggleFollow(userId: string, creatorId: string) {
  const existing = await prisma.creatorFollow.findUnique({
    where: { userId_creatorId: { userId, creatorId } },
  });

  if (existing) {
    await prisma.creatorFollow.delete({ where: { id: existing.id } });
    return { following: false };
  }

  await prisma.creatorFollow.create({ data: { userId, creatorId } });
  return { following: true };
}

export async function toggleLike(userId: string, contentId: string) {
  const existing = await prisma.contentLike.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (existing) {
    await prisma.contentLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.contentLike.create({ data: { userId, contentId } });
  return { liked: true };
}

export async function listFollowedCreators(userId: string) {
  return prisma.creatorFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
