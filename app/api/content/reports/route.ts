import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { createContentReport } from "@/services/support/reports";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  contentId: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const limit = rateLimit(`report:${authResult.userId}:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many reports." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || (!parsed.data.contentId && !parsed.data.targetUserId)) {
    return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  }

  const report = await createContentReport({
    reporterId: authResult.userId,
    contentId: parsed.data.contentId,
    targetUserId: parsed.data.targetUserId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  return NextResponse.json({ ok: true, id: report.id });
}
