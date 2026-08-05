import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSupportTicket } from "@/services/support/tickets";
import { auth } from "@/lib/auth/auth";

const bodySchema = z.object({
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(request: Request) {
  const limit = rateLimit(`support:${clientIp(request)}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many support requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid support request." }, { status: 400 });
  }

  const session = await auth();
  const ticket = await createSupportTicket({
    userId: session?.user?.id,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: true, id: ticket.id });
}
