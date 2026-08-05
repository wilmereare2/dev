import { prisma } from "@/lib/db/prisma";

export async function createContentReport(input: {
  reporterId: string;
  contentId?: string;
  targetUserId?: string;
  reason: string;
  details?: string;
}) {
  return prisma.contentReport.create({
    data: {
      reporterId: input.reporterId,
      contentId: input.contentId ?? null,
      targetUserId: input.targetUserId ?? null,
      reason: input.reason.trim(),
      details: input.details?.trim() || null,
    },
  });
}

export async function listOpenReports(limit = 50) {
  return prisma.contentReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateReportStatus(id: string, status: string) {
  return prisma.contentReport.update({ where: { id }, data: { status } });
}
