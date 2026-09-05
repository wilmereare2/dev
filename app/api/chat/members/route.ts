import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { listKnownMembers, searchMembers } from "@/services/chat/direct-messages";

export async function GET(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const knownOnly = searchParams.get("known") === "1";
  // Group invites may only target members with a verified email address.
  const verifiedOnly = searchParams.get("verified") === "1";

  if (knownOnly) {
    const members = await listKnownMembers(authResult.userId);
    return NextResponse.json({ members });
  }

  const members = await searchMembers(authResult.userId, q, 30, { verifiedOnly });
  return NextResponse.json({ members });
}
