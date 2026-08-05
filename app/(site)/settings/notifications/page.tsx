import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/guards";
import { getUserSettings } from "@/services/user/settings";
import { NotificationsForm } from "@/features/settings/notifications-form";

export const metadata: Metadata = {
  title: "Notification settings",
  robots: { index: false, follow: false },
};

export default async function NotificationSettingsPage() {
  const session = await requireSession();
  const settings = await getUserSettings(session.user.id);

  return (
    <NotificationsForm
      initial={{
        emailNotifications: settings?.emailNotifications ?? true,
        pushNotifications: settings?.pushNotifications ?? true,
        marketingEmails: settings?.marketingEmails ?? false,
        uploadAlerts: settings?.uploadAlerts ?? true,
        liveAlerts: settings?.liveAlerts ?? true,
        promoAlerts: settings?.promoAlerts ?? false,
      }}
    />
  );
}
