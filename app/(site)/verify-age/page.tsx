import type { Metadata } from "next";
import { VerifyAgeForm } from "@/features/compliance/verify-age-form";
import { auth } from "@/lib/auth/auth";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import {
  isSelfAttestationAllowed,
  isStrictAgeVerificationEnabled,
  isVendorAgeVerificationConfigured,
  requiresSignedInAgeVerification,
} from "@/lib/compliance/age-verification-policy";
import { sanitizeRedirectPath } from "@/lib/site/safe-redirect";
import { getComplianceStatus } from "@/services/user/compliance";

export const metadata: Metadata = {
  title: "Verify age",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ redirect?: string; vendor?: string }>;
};

export default async function VerifyAgePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params.redirect);
  const vendorComplete = params.vendor === "complete";

  const session = await auth();
  let alreadyVerified = false;
  let vendorPending = false;

  if (session?.user) {
    const userId = await resolveDbUserId({
      id: session.user.id,
      email: session.user.email,
    });
    if (userId) {
      const compliance = await getComplianceStatus(userId);
      alreadyVerified = compliance.ageVerified;
      vendorPending = vendorComplete && !alreadyVerified;
    }
  }

  return (
    <VerifyAgeForm
      redirectTo={redirectTo}
      alreadyVerified={alreadyVerified}
      vendorPending={vendorPending}
      signedIn={Boolean(session?.user)}
      selfAttestationAllowed={isSelfAttestationAllowed()}
      vendorVerificationConfigured={isVendorAgeVerificationConfigured()}
      strictVerification={isStrictAgeVerificationEnabled()}
      requiresSignIn={requiresSignedInAgeVerification() && !session?.user}
    />
  );
}
