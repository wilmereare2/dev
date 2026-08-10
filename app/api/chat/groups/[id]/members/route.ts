import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { inviteGroupMembers, listGroupMembers } from "@/services/chat/member-groups";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await listGroupMembers(id, authResult.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ members: result.members });
}

const inviteSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(24),
});

export async function POST(request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite request." }, { status: 400 });
  }

  const result = await inviteGroupMembers(id, authResult.userId, parsed.data.memberIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ added: result.added });
}
