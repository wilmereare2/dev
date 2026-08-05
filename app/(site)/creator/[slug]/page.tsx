import { notFound } from "next/navigation";
import { CreatorProfileView } from "@/features/creator/creator-profile-view";
import { decodeRouteParam } from "@/lib/site/route-params";
import { getCreatorPublicProfile } from "@/services/creator/public-profile";

type PageProps = { params: Promise<{ slug: string }> };

export default async function CreatorPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  const profile = await getCreatorPublicProfile(slug);
  if (!profile) notFound();

  return <CreatorProfileView profile={profile} />;
}
