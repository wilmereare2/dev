import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { listMutedUsers, muteUser, unmuteUser } from "@/services/user/security";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const items = await listMutedUsers(authResult.userId);
  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      mutedAt: item.createdAt.toISOString(),
      user: item.muted,
    })),
  });
}

const bodySchema = z.object({
  mutedId: z.string().min(1),
  action: z.enum(["mute", "unmute"]),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mute request." }, { status: 400 });
  }

  const result =
    parsed.data.action === "mute"
      ? await muteUser(authResult.userId, parsed.data.mutedId)
      : await unmuteUser(authResult.userId, parsed.data.mutedId);

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
