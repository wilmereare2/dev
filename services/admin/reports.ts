import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/admin/audit";

export async function listReports(input: {
  status?: string;
  priority?: string;
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (input.status && input.status !== "all") where.status = input.status;
  if (input.priority && input.priority !== "all") where.priority = input.priority;
  if (input.category && input.category !== "all") where.category = input.category;
  if (input.q?.trim()) {
    where.OR = [
      { reason: { contains: input.q.trim(), mode: "insensitive" } },
      { details: { contains: input.q.trim(), mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.contentReport.count({ where }),
    prisma.contentReport.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getReportDetail(id: string) {
  return prisma.contentReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function updateReport(
  id: string,
  input: {
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    note?: string;
    actorId: string;
  },
) {
  const existing = await prisma.contentReport.findUnique({ where: { id } });
  if (!existing) return null;

  const resolved = input.status === "resolved" || input.status === "closed";

  const updated = await prisma.$transaction(async (tx) => {
    const report = await tx.contentReport.update({
      where: { id },
      data: {
        status: input.status ?? existing.status,
        priority: input.priority ?? existing.priority,
        assigneeId: input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId,
        resolvedAt: resolved ? new Date() : existing.resolvedAt,
        resolvedById: resolved ? input.actorId : existing.resolvedById,
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.reportEvent.create({
      data: {
        reportId: id,
        actorId: input.actorId,
        action: "status_update",
        note: input.note?.trim() || null,
        previousStatus: existing.status,
        newStatus: report.status,
      },
    });

    return report;
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "report.update",
    entity: "report",
    entityId: id,
    targetLabel: existing.reason,
    previousValue: existing.status,
    newValue: updated.status,
    reason: input.note,
  });

  return updated;
}

export async function getModerationQueue() {
  const [uploads, reports, comments] = await Promise.all([
    prisma.creatorUpload.findMany({
      where: { status: { in: ["pending_review", "flagged"] } },
      orderBy: { submittedAt: "desc" },
      take: 50,
      include: {
        creator: { select: { id: true, name: true, email: true, image: true } },
        moderationLogs: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
    prisma.contentReport.findMany({
      where: { status: { in: ["open", "investigating"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: { reporter: { select: { name: true, email: true } } },
    }),
    prisma.comment.findMany({
      where: { approved: false },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { uploads, reports, comments };
}
