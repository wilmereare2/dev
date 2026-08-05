import { AdminCustomerDetail } from "@/features/dashboard/admin-customer-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminCustomerDetail userId={id} />;
}
