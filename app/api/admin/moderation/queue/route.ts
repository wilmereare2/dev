import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getModerationQueue } from "@/services/admin/reports";

export async function GET() {
  const auth = await requireAdminPermission("moderation.view");
  if ("error" in auth) return auth.error;

  const queue = await getModerationQueue();
  return NextResponse.json({
    uploads: queue.uploads.map((u) => ({
      ...u,
      submittedAt: u.submittedAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })),
    reports: queue.reports.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    comments: queue.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
