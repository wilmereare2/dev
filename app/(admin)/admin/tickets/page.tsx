import { AdminModerationList } from "@/features/dashboard/admin-moderation-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support tickets" description="Open support requests from users." />
      <AdminModerationList type="tickets" title="Open tickets" />
    </div>
  );
}
