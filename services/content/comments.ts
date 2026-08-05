import { prisma } from "@/lib/db/prisma";

export async function listComments(contentId: string, includePending = false) {
  return prisma.comment.findMany({
    where: { contentId, ...(includePending ? {} : { approved: true }) },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
}

export async function createComment(userId: string, contentId: string, body: string) {
  return prisma.comment.create({
    data: {
      userId,
      contentId,
      body: body.trim().slice(0, 2000),
      approved: false,
    },
  });
}

export async function moderateComment(commentId: string, approved: boolean) {
  return prisma.comment.update({ where: { id: commentId }, data: { approved } });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, userId } });
  if (!comment) return false;
  await prisma.comment.delete({ where: { id: commentId } });
  return true;
}
