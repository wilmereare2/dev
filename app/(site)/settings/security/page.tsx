import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { getTwoFactorStatus } from "@/services/user/security";
import { SecurityForm } from "@/features/settings/security-form";

export const metadata: Metadata = {
  title: "Security settings",
  robots: { index: false, follow: false },
};

export default async function SecuritySettingsPage() {
  const session = await requireSession();
  const twoFactor = await getTwoFactorStatus(session.user.id);

  return <SecurityForm twoFactorEnabled={twoFactor.enabled} />;
}
