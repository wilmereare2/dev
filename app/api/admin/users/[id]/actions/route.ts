import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { auditContextFromRequest } from "@/lib/admin/audit";
import {
  addAdminNote,
  banUser,
  listAdminNotes,
  restoreUser,
  revokeUserSessions,
  suspendUser,
  unsuspendUser,
  changeUserRole,
} from "@/services/admin/users";
import type { Role } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminPermission("users.view");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const notes = await listAdminNotes("user", id);
  return NextResponse.json({
    notes: notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const { id } = await context.params;
  const ctx = auditContextFromRequest(request);

  switch (body.action) {
    case "suspend": {
      const auth = await requireAdminPermission("users.manage");
      if ("error" in auth) return auth.error;
      if (typeof body.reason !== "string" || !body.reason.trim()) {
        return NextResponse.json({ error: "Reason required." }, { status: 400 });
      }
      await suspendUser(id, body.reason, { actorId: auth.userId, ...ctx });
      break;
    }
    case "unsuspend": {
      const auth = await requireAdminPermission("users.manage");
      if ("error" in auth) return auth.error;
      await unsuspendUser(id, { actorId: auth.userId, ...ctx });
      break;
    }
    case "ban": {
      const auth = await requireAdminPermission("users.ban");
      if ("error" in auth) return auth.error;
      if (typeof body.reason !== "string" || !body.reason.trim()) {
        return NextResponse.json({ error: "Reason required." }, { status: 400 });
      }
      await banUser(id, body.reason, { actorId: auth.userId, ...ctx });
      break;
    }
    case "restore": {
      const auth = await requireAdminPermission("users.manage");
      if ("error" in auth) return auth.error;
      await restoreUser(id, { actorId: auth.userId, ...ctx });
      break;
    }
    case "revoke_sessions": {
      const auth = await requireAdminPermission("users.sessions");
      if ("error" in auth) return auth.error;
      await revokeUserSessions(id, { actorId: auth.userId, ...ctx });
      break;
    }
    case "add_note": {
      const auth = await requireAdminPermission("users.manage");
      if ("error" in auth) return auth.error;
      if (typeof body.note !== "string" || !body.note.trim()) {
        return NextResponse.json({ error: "Note required." }, { status: 400 });
      }
      await addAdminNote({ targetType: "user", targetId: id, authorId: auth.userId, body: body.note });
      break;
    }
    case "change_role": {
      const auth = await requireAdminPermission("users.roles");
      if ("error" in auth) return auth.error;
      if (typeof body.role !== "string") {
        return NextResponse.json({ error: "Role required." }, { status: 400 });
      }
      await changeUserRole(id, body.role as Role, { actorId: auth.userId, ...ctx });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
