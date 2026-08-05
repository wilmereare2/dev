import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { listWatchHistory, upsertWatchProgress } from "@/services/user/library";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;
  const items = await listWatchHistory(authResult.userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({
  contentId: z.string().min(1),
  progressMs: z.number().int().min(0),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watch progress." }, { status: 400 });
  }

  const item = await upsertWatchProgress(
    authResult.userId,
    parsed.data.contentId,
    parsed.data.progressMs,
  );
  return NextResponse.json({ item });
}
