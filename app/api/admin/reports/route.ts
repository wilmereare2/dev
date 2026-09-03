import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { listReports } from "@/services/admin/reports";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("reports.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const result = await listReports({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "25"),
  });

  return NextResponse.json({
    ...result,
    items: result.items.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    })),
  });
}
