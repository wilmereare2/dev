import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { updateNotificationSettings } from "@/services/user/settings";

const bodySchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  uploadAlerts: z.boolean().optional(),
  liveAlerts: z.boolean().optional(),
  promoAlerts: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification settings." }, { status: 400 });
  }

  const settings = await updateNotificationSettings(authResult.userId, parsed.data);
  return NextResponse.json({ settings });
}
