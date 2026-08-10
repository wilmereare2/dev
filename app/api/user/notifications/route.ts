import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markConversationNotificationsRead,
  markNotificationRead,
} from "@/services/user/notifications";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const [items, unreadCount] = await Promise.all([
    listNotifications(authResult.userId),
    countUnreadNotifications(authResult.userId),
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
