import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { getUserSettings } from "@/services/user/settings";
import { PrivacyForm } from "@/features/settings/privacy-form";

export const metadata: Metadata = {
  title: "Privacy settings",
  robots: { index: false, follow: false },
};

export default async function PrivacySettingsPage() {
  const session = await requireSession();
  const settings = await getUserSettings(session.user.id);

  return (
    <PrivacyForm
      initial={{
        showActivity: settings?.showActivity ?? true,
        anonymousMode: settings?.anonymousMode ?? false,
        hideSubscriptions: settings?.hideSubscriptions ?? false,
      }}
    />
  );
}
