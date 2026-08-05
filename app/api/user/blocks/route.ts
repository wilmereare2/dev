import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { blockUser, listBlockedUsers, unblockUser } from "@/services/user/security";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const items = await listBlockedUsers(authResult.userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({
  blockedId: z.string().min(1),
  action: z.enum(["block", "unblock"]),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid block request." }, { status: 400 });
  }

  const result =
    parsed.data.action === "block"
      ? await blockUser(authResult.userId, parsed.data.blockedId)
      : await unblockUser(authResult.userId, parsed.data.blockedId);

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
