import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { auditContextFromRequest } from "@/lib/admin/audit";
import { getReportDetail, updateReport } from "@/services/admin/reports";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("reports.view");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const report = await getReportDetail(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({
    report: {
      ...report,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
      events: report.events.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("reports.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const updated = await updateReport(id, {
    status: typeof body.status === "string" ? body.status : undefined,
    priority: typeof body.priority === "string" ? body.priority : undefined,
    assigneeId: "assigneeId" in body ? (body.assigneeId as string | null) : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
    actorId: auth.userId,
  });

  if (!updated) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  void auditContextFromRequest(request);

  return NextResponse.json({
    report: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    },
  });
}
