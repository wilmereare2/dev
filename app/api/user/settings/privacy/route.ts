import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { updatePrivacySettings } from "@/services/user/settings";

const bodySchema = z.object({
  showActivity: z.boolean().optional(),
  anonymousMode: z.boolean().optional(),
  hideSubscriptions: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid privacy settings." }, { status: 400 });
  }

  const settings = await updatePrivacySettings(authResult.userId, parsed.data);
  return NextResponse.json({ settings });
}
