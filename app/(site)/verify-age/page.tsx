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

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Age verification</h1>
      <p className="mt-3 text-secondary">Required before browsing manuelaX.</p>
      <div className="mt-8">
        <VerifyAgeForm redirectTo={redirectTo} />
      </div>
    </section>
  );
}
