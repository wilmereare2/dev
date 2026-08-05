import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { listEnabledAdminCategories } from "@/lib/admin/bootstrap";

export async function GET() {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const categories = await listEnabledAdminCategories();
  return NextResponse.json({ categories });
}
