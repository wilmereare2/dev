import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { toggleLike } from "@/services/user/library";

const bodySchema = z.object({ contentId: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content id." }, { status: 400 });
  }

  const result = await toggleLike(authResult.userId, parsed.data.contentId);
  return NextResponse.json(result);
}
