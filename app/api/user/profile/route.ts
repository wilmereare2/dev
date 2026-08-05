import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { getUserProfile } from "@/services/user/settings";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const profile = await getUserProfile(authResult.userId);
  return NextResponse.json({ profile });
}
