import { AdminCreatorsList } from "@/features/dashboard/admin-creators-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Creator management" description="Review applications, verification status, and creator accounts." />
      <AdminCreatorsList />
    </div>
  );
}
