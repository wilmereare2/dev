import { prisma } from "@/lib/db/prisma";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  targetLabel?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      targetLabel: input.targetLabel ?? null,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      reason: input.reason ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export function auditContextFromRequest(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
