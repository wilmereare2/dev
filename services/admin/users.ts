import { prisma } from "@/lib/db/prisma";
import { writeAuditLog, type AuditInput } from "@/lib/admin/audit";
import type { Role } from "@/types";
import { parseRole } from "@/lib/auth/roles";

export async function suspendUser(
  userId: string,
  reason: string,
  audit: Omit<AuditInput, "action" | "entity" | "entityId">,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: "suspended",
      suspendedAt: new Date(),
      banReason: reason.trim(),
    },
  });
  await writeAuditLog({
    ...audit,
    action: "user.suspend",
    entity: "user",
    entityId: userId,
    targetLabel: user.email,
    newValue: "suspended",
    reason,
  });
  return user;
}

export async function unsuspendUser(userId: string, audit: Omit<AuditInput, "action" | "entity" | "entityId">) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: "active", suspendedAt: null, banReason: null },
  });
  await writeAuditLog({
    ...audit,
    action: "user.unsuspend",
    entity: "user",
    entityId: userId,
    targetLabel: user.email,
    newValue: "active",
  });
  return user;
}

export async function banUser(
  userId: string,
  reason: string,
  audit: Omit<AuditInput, "action" | "entity" | "entityId">,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: "banned",
      bannedAt: new Date(),
      banReason: reason.trim(),
    },
  });
  await prisma.session.deleteMany({ where: { userId } });
  await writeAuditLog({
    ...audit,
    action: "user.ban",
    entity: "user",
    entityId: userId,
    targetLabel: user.email,
    newValue: "banned",
    reason,
  });
  return user;
}

export async function restoreUser(userId: string, audit: Omit<AuditInput, "action" | "entity" | "entityId">) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: "active", bannedAt: null, suspendedAt: null, banReason: null },
  });
  await writeAuditLog({
    ...audit,
    action: "user.restore",
    entity: "user",
    entityId: userId,
    targetLabel: user.email,
    newValue: "active",
  });
  return user;
}

export async function revokeUserSessions(userId: string, audit: Omit<AuditInput, "action" | "entity" | "entityId">) {
  const result = await prisma.session.deleteMany({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  await writeAuditLog({
    ...audit,
    action: "user.revoke_sessions",
    entity: "user",
    entityId: userId,
    targetLabel: user?.email ?? userId,
    meta: { count: result.count },
  });
  return result.count;
}

export async function changeUserRole(
  userId: string,
  role: Role,
  audit: Omit<AuditInput, "action" | "entity" | "entityId">,
) {
  const parsed = parseRole(role);
  if (!parsed) throw new Error("Invalid role");

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!existing) throw new Error("User not found");

  const user = await prisma.user.update({ where: { id: userId }, data: { role: parsed } });
  await writeAuditLog({
    ...audit,
    action: "user.role_change",
    entity: "user",
    entityId: userId,
    targetLabel: existing.email,
    previousValue: existing.role,
    newValue: parsed,
  });
  return user;
}

export async function addAdminNote(input: {
  targetType: string;
  targetId: string;
  authorId: string;
  body: string;
}) {
  const note = await prisma.adminNote.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      authorId: input.authorId,
      body: input.body.trim().slice(0, 5000),
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return note;
}

export async function listAdminNotes(targetType: string, targetId: string) {
  return prisma.adminNote.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function searchAuditLogs(input: {
  q?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const where: {
    action?: { contains: string; mode: "insensitive" };
    OR?: Array<{ targetLabel?: { contains: string; mode: "insensitive" }; entityId?: { contains: string; mode: "insensitive" } }>;
  } = {};

  if (input.action?.trim()) where.action = { contains: input.action.trim(), mode: "insensitive" };
  if (input.q?.trim()) {
    where.OR = [
      { targetLabel: { contains: input.q.trim(), mode: "insensitive" } },
      { entityId: { contains: input.q.trim(), mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
