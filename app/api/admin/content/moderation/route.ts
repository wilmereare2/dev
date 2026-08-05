import { NextResponse } from "next/server";
import { requireModeratorUser } from "@/lib/api/require-creator";
import { listPendingUploads, moderateUpload } from "@/services/creator/uploads";

export async function GET() {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const items = await listPendingUploads();
  return NextResponse.json({ items });
}
