import type { Metadata } from "next";
import { VerifyAgeForm } from "@/features/compliance/verify-age-form";
import { sanitizeRedirectPath } from "@/lib/site/safe-redirect";

export const metadata: Metadata = {
  title: "Verify age",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function VerifyAgePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params.redirect);

  return <VerifyAgeForm redirectTo={redirectTo} />;
}
