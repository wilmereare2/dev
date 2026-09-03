import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { searchAuditLogs } from "@/services/admin/users";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("audit.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const result = await searchAuditLogs({
    q: searchParams.get("q") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "25"),
  });

  return NextResponse.json({
    ...result,
    items: result.items.map((row) => ({
      id: row.id,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      targetLabel: row.targetLabel,
      previousValue: row.previousValue,
      newValue: row.newValue,
      reason: row.reason,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor ? { id: row.actor.id, name: row.actor.name, email: row.actor.email } : null,
    })),
  });
}
