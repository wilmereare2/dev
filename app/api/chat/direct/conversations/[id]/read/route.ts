import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { markDirectConversationRead } from "@/services/chat/direct-messages";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await markDirectConversationRead(id, authResult.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
