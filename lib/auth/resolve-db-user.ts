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

/**
 * Root-layout bootstrap: resolves the database user and their stored locale in
 * a single query. The layout needs both on every request, and issuing them
 * separately put two sequential round trips in front of every page render.
 */
export async function resolveDbUserWithLocale(user: { id?: string; email?: string | null }) {
  const select = { id: true, settings: { select: { locale: true } } } as const;

  if (user.id) {
    const byId = await prisma.user.findUnique({ where: { id: user.id }, select });
    if (byId) return { userId: byId.id, locale: byId.settings?.locale ?? null };
  }

  if (user.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: normalizeEmail(user.email) },
      select,
    });
    if (byEmail) return { userId: byEmail.id, locale: byEmail.settings?.locale ?? null };
  }

  return { userId: null as string | null, locale: null as string | null };
}
