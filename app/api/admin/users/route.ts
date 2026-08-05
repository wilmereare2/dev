import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { searchCustomers } from "@/services/admin/customers";

export async function GET(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");

  const result = await searchCustomers({
    q,
    role,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  });

  return NextResponse.json(result);
}
