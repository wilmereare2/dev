import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { AccountPanel } from "@/features/auth/account-panel";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Account",
  description: `Manage your ${APP_NAME} account, preferences, and membership.`,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  const googleAuthEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <Suspense fallback={null}>
      <AccountPanel session={session} googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
