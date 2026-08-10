import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { joinPublicGroup, setGroupArchived } from "@/services/chat/member-groups";

type Params = { params: Promise<{ id: string }> };

const archiveSchema = z.object({
  archived: z.boolean(),
});

export async function PATCH(request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = archiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid archive request." }, { status: 400 });
  }

  const result = await setGroupArchived(id, authResult.userId, parsed.data.archived);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ group: result.group });
}

export async function POST(_request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await joinPublicGroup(id, authResult.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ group: result.group });
}
