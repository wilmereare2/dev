import { AdminContentModeration } from "@/features/dashboard/admin-content-moderation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Content management" description="Review creator uploads, edit metadata, and moderate published content." />
      <AdminContentModeration />
    </div>
  );
}
