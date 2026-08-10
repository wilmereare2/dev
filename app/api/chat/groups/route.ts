import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { createMemberGroup, listMemberGroups } from "@/services/chat/member-groups";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const groups = await listMemberGroups(authResult.userId);
  return NextResponse.json({ groups });
}

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional().nullable(),
  memberIds: z.array(z.string().min(1)).max(24).default([]),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const result = await createMemberGroup(authResult.userId, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ group: result.group });
}
