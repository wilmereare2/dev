import { CreatorUploadManage } from "@/features/dashboard/creator-upload-manage";

type PageProps = { params: Promise<{ id: string }> };

export default async function CreatorUploadDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CreatorUploadManage uploadId={id} />;
}
