import { prisma } from "@/lib/db/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function resolveDbUserId(user: { id?: string; email?: string | null }) {
  if (user.id) {
    const byId = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  if (user.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: normalizeEmail(user.email) },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }

  return null;
}
