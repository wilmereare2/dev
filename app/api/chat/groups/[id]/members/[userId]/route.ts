import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { removeGroupMember, updateGroupMemberRole } from "@/services/chat/member-groups";

type Params = { params: Promise<{ id: string; userId: string }> };

const roleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id, userId: targetUserId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role update." }, { status: 400 });
  }

  const result = await updateGroupMemberRole(id, authResult.userId, targetUserId, parsed.data.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id, userId: targetUserId } = await params;
  const result = await removeGroupMember(id, authResult.userId, targetUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
