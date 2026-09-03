import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { writeAuditLog, auditContextFromRequest } from "@/lib/admin/audit";
import {
  DEFAULT_PLATFORM_SETTINGS,
  getComplianceOverview,
  getPlatformSettings,
  listCommentsForModeration,
  moderateCommentAdmin,
  upsertPlatformSetting,
} from "@/services/admin/platform";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") ?? "settings";

  if (section === "compliance") {
    const auth = await requireAdminPermission("compliance.view");
    if ("error" in auth) return auth.error;
    return NextResponse.json(await getComplianceOverview());
  }

  if (section === "comments") {
    const auth = await requireAdminPermission("comments.moderate");
    if ("error" in auth) return auth.error;
    const result = await listCommentsForModeration({
      approved: searchParams.get("approved") === "true",
      page: Number(searchParams.get("page") ?? "1"),
    });
    return NextResponse.json({
      ...result,
      items: result.items.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    });
  }

  const auth = await requireAdminPermission("settings.view");
  if ("error" in auth) return auth.error;

  const rows = await getPlatformSettings();
  const settings: Record<string, unknown> = { ...DEFAULT_PLATFORM_SETTINGS };
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return NextResponse.json({ settings, rows });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const section = typeof body.section === "string" ? body.section : "settings";

  if (section === "comments") {
    const auth = await requireAdminPermission("comments.moderate");
    if ("error" in auth) return auth.error;

    const commentId = typeof body.commentId === "string" ? body.commentId : null;
    const action = body.action === "approve" || body.action === "remove" ? body.action : null;
    if (!commentId || !action) {
      return NextResponse.json({ error: "commentId and action required." }, { status: 400 });
    }

    const ctx = auditContextFromRequest(request);
    await moderateCommentAdmin(commentId, action, auth.userId);
    await writeAuditLog({
      actorId: auth.userId,
      action: action === "remove" ? "comment.remove" : "comment.approve",
      entity: "comment",
      entityId: commentId,
      ...ctx,
    });

    return NextResponse.json({ ok: true });
  }

  const auth = await requireAdminPermission("settings.manage");
  if ("error" in auth) return auth.error;

  const key = typeof body.key === "string" ? body.key : null;
  if (!key || !(key in DEFAULT_PLATFORM_SETTINGS)) {
    return NextResponse.json({ error: "Invalid setting key." }, { status: 400 });
  }

  const ctx = auditContextFromRequest(request);
  await upsertPlatformSetting(key, body.value, auth.userId);
  await writeAuditLog({
    actorId: auth.userId,
    action: "settings.update",
    entity: "setting",
    entityId: key,
    newValue: JSON.stringify(body.value),
    ...ctx,
  });

  return NextResponse.json({ ok: true });
}
