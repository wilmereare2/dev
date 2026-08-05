import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { listBookmarks, toggleBookmark } from "@/services/user/library";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;
  const items = await listBookmarks(authResult.userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({ contentId: z.string().min(1) });

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content id." }, { status: 400 });
  }

  const result = await toggleBookmark(authResult.userId, parsed.data.contentId);
  return NextResponse.json(result);
}
