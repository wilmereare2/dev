import { prisma } from "@/lib/db/prisma";
import { deserializeTags, serializeTags } from "@/lib/creator/media";
import { scanContentForModeration } from "@/lib/moderation/ai-scan";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { resolveMemberPostAccess } from "@/services/creator/monetization";
import { ensureSanityCreatorDoc } from "@/services/creator/profile";
import type { ContentStatus, ContentVisibility, MediaType } from "@/types";

type CreateUploadInput = {
  title: string;
  description?: string;
  mediaType?: MediaType;
  visibility?: ContentVisibility;
  thumbnailUrl?: string;
  mediaUrl?: string;
  galleryImages?: string[];
  tags?: string[];
  categories?: string[];
  scheduledAt?: Date | null;
  isPremium?: boolean;
  ppvPriceCents?: number | null;
  fileSizeBytes?: number;
  durationSeconds?: number;
  resolution?: string;
};

export function mapUpload(record: Awaited<ReturnType<typeof getCreatorUpload>>) {
  if (!record) return null;
  return {
    ...record,
    tags: deserializeTags(record.tags),
    categories: deserializeTags(record.categories),
    galleryImages: record.galleryImages ? (JSON.parse(record.galleryImages) as string[]) : [],
  };
}

export async function getCreatorUpload(id: string, creatorUserId?: string) {
  return prisma.creatorUpload.findFirst({
    where: { id, ...(creatorUserId ? { creatorUserId } : {}) },
  });
}

export async function listCreatorUploads(creatorUserId: string, status?: ContentStatus) {
  const items = await prisma.creatorUpload.findMany({
    where: { creatorUserId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
  });
  return items.map((item) => mapUpload(item)!);
}

export async function listPendingUploads(limit = 50) {
  const items = await prisma.creatorUpload.findMany({
    where: { status: { in: ["pending_review", "flagged"] } },
    orderBy: { submittedAt: "asc" },
    take: limit,
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });
  return items.map((item) => ({ ...mapUpload(item)!, creator: item.creator }));
}

const publicPostInclude = {
  creator: {
    select: {
      id: true,
      name: true,
      image: true,
      creatorProfile: { select: { displayName: true, sanityCreatorSlug: true } },
    },
  },
} as const;

export function stripMemberPostMedia(post: ReturnType<typeof mapPublicMemberPost>) {
  return { ...post, mediaUrl: null };
}

export async function listPublishedMemberPosts(limit = 48) {
  const items = await prisma.creatorUpload.findMany({
    where: {
      status: "published",
      visibility: { not: "private" },
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: Math.min(Math.max(limit, 1), 100),
    include: publicPostInclude,
  });
  return items.map((item) => stripMemberPostMedia(mapPublicMemberPost(item)));
}

export async function getPublicMemberPost(id: string) {
  const item = await prisma.creatorUpload.findFirst({
    where: {
      id,
      status: "published",
      visibility: { in: ["public", "followers", "subscribers"] },
    },
    include: publicPostInclude,
  });
  if (!item) return null;
  return mapPublicMemberPost(item);
}

export async function getMemberPostView(id: string, userId?: string) {
  const item = await prisma.creatorUpload.findFirst({
    where: {
      id,
      status: "published",
      visibility: { in: ["public", "followers", "subscribers"] },
    },
    include: publicPostInclude,
  });
  if (!item) return null;

  const post = mapPublicMemberPost(item);
  const access = await resolveMemberPostAccess(userId, {
    id: post.id,
    creatorUserId: item.creatorUserId,
    visibility: post.visibility,
    isPremium: post.isPremium,
    ppvPriceCents: post.ppvPriceCents,
  });

  if (access.canAccess) {
    return { post, access };
  }

  return { post: stripMemberPostMedia(post), access };
}

type PublishedMemberPostRecord = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.creatorUpload.findFirst<{ include: typeof publicPostInclude }>
    >
  >
>;

export function mapPublicMemberPost(record: PublishedMemberPostRecord) {
  const mapped = mapUpload(record)!;
  return {
    id: mapped.id,
    title: mapped.title,
    description: mapped.description,
    mediaType: mapped.mediaType,
    thumbnailUrl: mapped.thumbnailUrl,
    mediaUrl: mapped.mediaUrl,
    visibility: mapped.visibility,
    isPremium: mapped.isPremium,
    ppvPriceCents: mapped.ppvPriceCents,
    categories: mapped.categories,
    tags: mapped.tags,
    publishedAt: record.publishedAt?.toISOString() ?? mapped.updatedAt.toISOString(),
    creator: {
      id: record.creator.id,
      name: record.creator.creatorProfile?.displayName ?? record.creator.name,
      image: record.creator.image,
      slug: record.creator.creatorProfile?.sanityCreatorSlug ?? null,
    },
  };
}

export async function createCreatorUpload(creatorUserId: string, input: CreateUploadInput) {
  const scan = scanContentForModeration({
    title: input.title,
    description: input.description,
    mediaType: input.mediaType,
    fileSizeBytes: input.fileSizeBytes,
  });

  return prisma.creatorUpload.create({
    data: {
      creatorUserId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      mediaType: input.mediaType ?? "video",
      visibility: input.visibility ?? "public",
      thumbnailUrl: input.thumbnailUrl ?? null,
      mediaUrl: input.mediaUrl ?? null,
      galleryImages: input.galleryImages?.length ? JSON.stringify(input.galleryImages) : null,
      tags: serializeTags(input.tags ?? []),
      categories: serializeTags(input.categories ?? []),
      scheduledAt: input.scheduledAt ?? null,
      isPremium: input.isPremium ?? false,
      ppvPriceCents: input.ppvPriceCents ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      durationSeconds: input.durationSeconds ?? null,
      resolution: input.resolution ?? null,
      aiModerationScore: scan.score,
      aiModerationFlags: scan.flags.length ? JSON.stringify(scan.flags) : null,
      status: scan.recommendation === "reject" ? "flagged" : "draft",
    },
  });
}

export async function updateCreatorUpload(
  id: string,
  creatorUserId: string,
  input: Partial<CreateUploadInput> & { title?: string },
) {
  const existing = await getCreatorUpload(id, creatorUserId);
  if (!existing) return null;
  if (!["draft", "rejected"].includes(existing.status)) {
    throw new Error("Only drafts or rejected uploads can be edited.");
  }

  return prisma.creatorUpload.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.mediaType !== undefined ? { mediaType: input.mediaType } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
      ...(input.mediaUrl !== undefined ? { mediaUrl: input.mediaUrl } : {}),
      ...(input.galleryImages !== undefined
        ? { galleryImages: input.galleryImages.length ? JSON.stringify(input.galleryImages) : null }
        : {}),
      ...(input.tags !== undefined ? { tags: serializeTags(input.tags) } : {}),
      ...(input.categories !== undefined ? { categories: serializeTags(input.categories) } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
      ...(input.ppvPriceCents !== undefined ? { ppvPriceCents: input.ppvPriceCents } : {}),
      ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
      ...(input.resolution !== undefined ? { resolution: input.resolution } : {}),
      status: "draft",
    },
  });
}

export async function submitUploadForReview(id: string, creatorUserId: string) {
  const upload = await getCreatorUpload(id, creatorUserId);
  if (!upload) return null;

  const scan = scanContentForModeration({
    title: upload.title,
    description: upload.description ?? undefined,
    mediaType: upload.mediaType,
    fileSizeBytes: upload.fileSizeBytes ?? undefined,
  });

  return prisma.creatorUpload.update({
    where: { id },
    data: {
      status: scan.recommendation === "reject" ? "flagged" : "pending_review",
      submittedAt: new Date(),
      aiModerationScore: scan.score,
      aiModerationFlags: scan.flags.length ? JSON.stringify(scan.flags) : null,
    },
  });
}

export async function deleteCreatorUpload(id: string, creatorUserId: string) {
  const upload = await getCreatorUpload(id, creatorUserId);
  if (!upload) return false;
  await prisma.creatorUpload.delete({ where: { id } });
  return true;
}

async function publishToSanity(upload: NonNullable<Awaited<ReturnType<typeof getCreatorUpload>>>) {
  const client = getSanityWriteClient();
  if (!client) return null;

  const profile = await ensureSanityCreatorDoc(upload.creatorUserId);
  if (!profile?.sanityCreatorId) return null;

  const slug = upload.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const doc = await client.create({
    _type: "content",
    title: upload.title,
    slug: { _type: "slug", current: `${slug}-${upload.id.slice(-6)}` },
    synopsis: upload.description ?? "",
    videoUrl: upload.mediaUrl ?? undefined,
    durationSeconds: upload.durationSeconds ?? undefined,
    isPremium: upload.isPremium,
    featured: false,
    publishedAt: upload.scheduledAt && upload.scheduledAt > new Date() ? null : new Date().toISOString(),
    status: "published",
    ownerUserId: upload.creatorUserId,
    visibility: upload.visibility,
    ppvPriceCents: upload.ppvPriceCents ?? undefined,
    creators: [{ _type: "reference", _ref: profile.sanityCreatorId, _key: profile.sanityCreatorId }],
  });

  return doc._id as string;
}

export async function moderateUpload(input: {
  uploadId: string;
  actorId: string;
  action: "approve" | "reject" | "flag" | "remove";
  reason?: string;
}) {
  const upload = await getCreatorUpload(input.uploadId);
  if (!upload) return null;

  let status: ContentStatus = upload.status as ContentStatus;
  let sanityContentId = upload.sanityContentId;
  let publishedAt = upload.publishedAt;

  if (input.action === "approve") {
    status = upload.scheduledAt && upload.scheduledAt > new Date() ? "approved" : "published";
    if (!sanityContentId) {
      sanityContentId = (await publishToSanity(upload)) ?? null;
    }
    if (status === "published") publishedAt = new Date();
  } else if (input.action === "reject") {
    status = "rejected";
  } else if (input.action === "flag") {
    status = "flagged";
  } else if (input.action === "remove") {
    status = "removed";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.creatorUpload.update({
      where: { id: input.uploadId },
      data: {
        status,
        sanityContentId,
        publishedAt,
        moderationNotes: input.reason ?? upload.moderationNotes,
        reviewedById: input.actorId,
        reviewedAt: new Date(),
      },
    });

    await tx.contentModerationLog.create({
      data: {
        uploadId: input.uploadId,
        actorId: input.actorId,
        action: input.action,
        reason: input.reason ?? null,
      },
    });

    if (input.action === "approve") {
      await tx.notification.create({
        data: {
          userId: upload.creatorUserId,
          type: "upload_approved",
          title: "Upload approved",
          body: `"${upload.title}" is ${status === "published" ? "live" : "scheduled"}.`,
          href: "/creator-dashboard/content",
        },
      });
    }

    if (input.action === "reject") {
      await tx.notification.create({
        data: {
          userId: upload.creatorUserId,
          type: "upload_rejected",
          title: "Upload rejected",
          body: input.reason ?? `"${upload.title}" needs changes before publishing.`,
          href: `/creator-dashboard/content/${upload.id}`,
        },
      });
    }

    return record;
  });

  return mapUpload(updated);
}

export async function incrementUploadView(uploadId: string) {
  await prisma.creatorUpload.update({
    where: { id: uploadId },
    data: { viewCount: { increment: 1 } },
  });
}
