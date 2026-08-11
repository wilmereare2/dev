import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BillingReturnBanner } from "@/components/billing/billing-return-banner";
import { CreatorProfileView } from "@/features/creator/creator-profile-view";
import { decodeRouteParam } from "@/lib/site/route-params";
import { isCreatorMonetizationEnabled } from "@/services/billing/creator-monetization";
import { getCreatorPublicProfile } from "@/services/creator/public-profile";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function CreatorPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  const profile = await getCreatorPublicProfile(slug);
  if (!profile) notFound();

  return (
    <>
      <Suspense fallback={null}>
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <BillingReturnBanner successMessage="Payment complete. Creator support is active on your account." />
        </div>
      </Suspense>
      <CreatorProfileView profile={profile} monetizationEnabled={isCreatorMonetizationEnabled()} />
    </>
  );
}
