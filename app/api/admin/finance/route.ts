import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getFinanceOverview } from "@/services/admin/platform";

export async function GET(request: Request) {
  const auth = await requireAdminPermission("finance.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const data = await getFinanceOverview({
    from: fromRaw ? new Date(fromRaw) : undefined,
    to: toRaw ? new Date(toRaw) : undefined,
  });

  return NextResponse.json(data);
}
