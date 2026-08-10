import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createDirectMessage,
  listDirectMessages,
  listDirectMessagesSince,
} from "@/services/chat/direct-messages";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");

  if (after) {
    const messages = await listDirectMessagesSince(id, authResult.userId, after);
    return NextResponse.json({ messages });
  }

  const result = await listDirectMessages(id, authResult.userId, 50);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ messages: result.messages });
}

const bodySchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const limit = rateLimit(`dm:${authResult.userId}:${clientIp(request)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many messages. Slow down for a moment." }, { status: 429 });
  }

  const { id } = await params;
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

  const result = await createDirectMessage(id, authResult.userId, parsed.data.body);
  if (!result.ok) {
    const status = result.error === "Conversation not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ message: result.message });
}
