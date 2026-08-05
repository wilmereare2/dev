import { prisma } from "@/lib/db/prisma";

export async function createSupportTicket(input: {
  userId?: string;
  email: string;
  subject: string;
  message: string;
}) {
  return prisma.supportTicket.create({
    data: {
      userId: input.userId ?? null,
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    },
  });
}

export async function listOpenTickets(limit = 50) {
  return prisma.supportTicket.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function updateTicketStatus(id: string, status: string) {
  return prisma.supportTicket.update({ where: { id }, data: { status } });
}
