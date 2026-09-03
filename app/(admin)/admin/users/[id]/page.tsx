import { AdminUserDetailPage } from "@/features/admin/users/admin-user-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AdminUserDetailPage userId={id} />;
}
