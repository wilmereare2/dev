import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { listOpenReports, updateReportStatus } from "@/services/support/reports";
import { listOpenTickets, updateTicketStatus } from "@/services/support/tickets";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export async function GET(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "overview";

  if (type === "reports") {
    return NextResponse.json({ items: await listOpenReports() });
  }

  if (type === "tickets") {
    return NextResponse.json({ items: await listOpenTickets() });
  }

  const [users, subscriptions, reports, tickets] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.contentReport.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);

  return NextResponse.json({
    stats: { users, activeSubscriptions: subscriptions, openReports: reports, openTickets: tickets },
  });
}

const patchSchema = z.object({
  type: z.enum(["report", "ticket"]),
  id: z.string(),
  status: z.string(),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const item =
    parsed.data.type === "report"
      ? await updateReportStatus(parsed.data.id, parsed.data.status)
      : await updateTicketStatus(parsed.data.id, parsed.data.status);

  return NextResponse.json({ item });
}
