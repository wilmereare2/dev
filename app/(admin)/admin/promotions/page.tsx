import { AdminPromotionsPanel } from "@/features/dashboard/admin-promotions-panel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Promotions" description="Featured creators, homepage campaigns, and editorial selections." />
      <AdminPromotionsPanel />
    </div>
  );
}
