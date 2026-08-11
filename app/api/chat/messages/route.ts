import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createChatMessage,
  getRecentChatMessages,
  listChatMessagesSince,
  syncRecentChatMessages,
} from "@/services/chat/member-chat";

export async function GET(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const sync = searchParams.get("sync") === "1";

    if (sync) {
      const messages = await syncRecentChatMessages(50);
      return NextResponse.json({ messages });
    }

    const messages = after ? await listChatMessagesSince(after) : await getRecentChatMessages(50);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[chat/messages]", error);
    return NextResponse.json(
      { error: "Community chat is temporarily unavailable. Try again in a moment." },
      { status: 503 },
    );
  }
}

const bodySchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const limit = rateLimit(`chat:${authResult.userId}:${clientIp(request)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many messages. Slow down for a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid message." },
      { status: 400 },
    );
  }

  const result = await createChatMessage(authResult.userId, parsed.data.body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: result.message });
}
