import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { searchCustomers } from "@/services/admin/customers";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("users.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const accountStatus = searchParams.get("accountStatus") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");

  const result = await searchCustomers({
    q,
    role,
    accountStatus,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  });

  return NextResponse.json(result);
}
