import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { purchaseContent, sendTip, subscribeToCreator } from "@/services/creator/monetization";

const purchaseSchema = z.object({ uploadId: z.string().min(1) });
const tipSchema = z.object({
  creatorUserId: z.string().min(1),
  amountCents: z.number().int().min(100),
  message: z.string().trim().max(500).optional(),
});
const subscribeSchema = z.object({ creatorUserId: z.string().min(1) });

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const action = typeof body === "object" && body ? String((body as { action?: string }).action) : "";

  if (action === "purchase") {
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid purchase." }, { status: 400 });
    const result = await purchaseContent(auth.userId, parsed.data.uploadId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ purchase: result.purchase });
  }

  if (action === "tip") {
    const parsed = tipSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid tip." }, { status: 400 });
    const result = await sendTip(
      auth.userId,
      parsed.data.creatorUserId,
      parsed.data.amountCents,
      parsed.data.message,
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ tip: result.tip });
  }

  if (action === "subscribe") {
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    const sub = await subscribeToCreator(auth.userId, parsed.data.creatorUserId);
    return NextResponse.json({ subscription: sub });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
