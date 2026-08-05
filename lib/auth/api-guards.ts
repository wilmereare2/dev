import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { Role } from "@/types";

export async function requireApiRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = session.user.role ?? "USER";
  if (!roles.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: session.user.id, role };
}
