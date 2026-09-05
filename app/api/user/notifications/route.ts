import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { requireVerifiedEmail } from "@/lib/auth/email-verification";
import {
  countNotifications,
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markConversationNotificationsRead,
  markNotificationRead,
} from "@/services/user/notifications";

export async function GET(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  // The notification channel requires a verified email address.
  const verified = await requireVerifiedEmail(authResult.userId, "notifications");
  if (!verified.allowed) {
    return NextResponse.json(
      { error: verified.message, code: verified.reason, items: [], unreadCount: 0, totalCount: 0 },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const [items, unreadCount, totalCount] = await Promise.all([
    listNotifications(authResult.userId, limit, offset),
    countUnreadNotifications(authResult.userId),
    countNotifications(authResult.userId),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
    unreadCount,
    totalCount,
  });
}

const patchSchema = z.object({
  notificationId: z.string().optional(),
  markAllRead: z.boolean().optional(),
  markConversationRead: z.string().optional(),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.data.markAllRead) {
    await markAllNotificationsRead(authResult.userId);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.markConversationRead) {
    await markConversationNotificationsRead(authResult.userId, parsed.data.markConversationRead);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.notificationId) {
    const updated = await markNotificationRead(authResult.userId, parsed.data.notificationId);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
