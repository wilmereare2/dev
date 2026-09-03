import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { Role } from "@/types";
import { canAccessAdmin, hasAdminPermission, type AdminPermission } from "@/lib/admin/permissions";

export async function requireAdminPermission(permission: AdminPermission) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user.role ?? "USER") as Role;
  if (!canAccessAdmin(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (!hasAdminPermission(role, permission)) {
    return { error: NextResponse.json({ error: "Insufficient permissions." }, { status: 403 }) };
  }

  return { userId: session.user.id, role, email: session.user.email ?? null };
}

/** Backward-compatible admin/moderator guard. */
export async function requireAdminApi() {
  return requireAdminPermission("dashboard.view");
}
