import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { getOrCreateReferralCode, listReferrals } from "@/services/referrals/referrals";
import { ReferralsView } from "@/features/referrals/referrals-view";

export const metadata: Metadata = {
  title: "Referrals",
  robots: { index: false, follow: false },
};

export default async function ReferralsPage() {
  const session = await requireSession();
  const [code, referrals] = await Promise.all([
    getOrCreateReferralCode(session.user.id),
    listReferrals(session.user.id),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Referrals</h1>
      <p className="mt-2 text-secondary">Share manuelaX and track referred members.</p>
      <div className="mt-8">
        <ReferralsView
          code={code.code}
          referrals={referrals.map((referral) => ({
            ...referral,
            createdAt: referral.createdAt.toISOString(),
          }))}
        />
      </div>
    </section>
  );
}
