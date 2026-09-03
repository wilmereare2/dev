import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/require-permission";
import { getAdminDashboardAnalytics, type DateRangePreset } from "@/services/admin/analytics";

const PRESETS = new Set(["7d", "30d", "90d", "month", "all"]);

export async function GET(request: Request) {
  const auth = await requireAdminPermission("dashboard.view");
  if ("error" in auth) return auth.error;

  const preset = (new URL(request.url).searchParams.get("preset") ?? "30d") as DateRangePreset;
  const data = await getAdminDashboardAnalytics(PRESETS.has(preset) ? preset : "30d");
  return NextResponse.json(data);
}
