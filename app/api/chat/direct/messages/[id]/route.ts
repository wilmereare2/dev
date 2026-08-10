import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { deleteDirectMessage } from "@/services/chat/direct-messages";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await deleteDirectMessage(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
