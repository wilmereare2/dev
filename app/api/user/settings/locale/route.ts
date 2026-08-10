import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { isSupportedLocale } from "@/lib/i18n";
import { updateLocale } from "@/services/user/settings";

const bodySchema = z.object({
  locale: z.string().min(2).max(10),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isSupportedLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }

  await updateLocale(authResult.userId, parsed.data.locale);
  return NextResponse.json({ ok: true, locale: parsed.data.locale });
}
