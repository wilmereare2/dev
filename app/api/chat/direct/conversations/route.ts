import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import {
  getOrCreateDirectConversation,
  listDirectConversations,
} from "@/services/chat/direct-messages";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const conversations = await listDirectConversations(authResult.userId);
  return NextResponse.json({ conversations });
}

const bodySchema = z.object({
  peerId: z.string().min(1),
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

  const result = await getOrCreateDirectConversation(authResult.userId, parsed.data.peerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ conversation: result.conversation });
}
