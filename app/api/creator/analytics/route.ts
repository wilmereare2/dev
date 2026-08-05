import { NextResponse } from "next/server";
import { requireCreatorUser } from "@/lib/api/require-creator";
import { getCreatorAnalytics } from "@/services/creator/analytics";

export async function GET() {
  const auth = await requireCreatorUser();
  if ("error" in auth) return auth.error;

  const analytics = await getCreatorAnalytics(auth.userId);
  return NextResponse.json({ analytics });
}
