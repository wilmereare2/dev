import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createGroupMessage, listGroupMessages } from "@/services/chat/member-groups";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const result = await listGroupMessages(id, authResult.userId, 50);
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

  const limit = rateLimit(`group-msg:${authResult.userId}:${clientIp(request)}`, 30, 60_000);
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

  const result = await createGroupMessage(id, authResult.userId, parsed.data.body);
  if (!result.ok) {
    const status = result.error === "Group not found." ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ message: result.message });
}
