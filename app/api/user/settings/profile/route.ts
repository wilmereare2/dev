import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { updateProfile } from "@/services/user/settings";

const bodySchema = z.object({
  name: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  }

  const profile = await updateProfile(authResult.userId, parsed.data);
  return NextResponse.json({ profile });
}
