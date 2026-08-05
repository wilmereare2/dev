import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { listFollowedCreators, toggleFollow } from "@/services/user/library";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;
  const items = await listFollowedCreators(authResult.userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({ creatorId: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid creator id." }, { status: 400 });
  }

  const result = await toggleFollow(authResult.userId, parsed.data.creatorId);
  return NextResponse.json(result);
}
