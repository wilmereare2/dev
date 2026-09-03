import { AdminAdvertisementsPanel } from "@/features/dashboard/admin-advertisements-panel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Advertisements" description="Manage placements, creatives, scheduling, and performance." />
      <AdminAdvertisementsPanel />
    </div>
  );
}
