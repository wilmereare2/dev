import { BusinessDashboardPanel } from "@/features/dashboard/creator-platform-panels";
import { requireRole } from "@/lib/auth/guards";

export default async function BusinessDashboardPage() {
  await requireRole(["BUSINESS", "ADMIN"]);
  return <BusinessDashboardPanel />;
}
