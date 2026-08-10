import type { Metadata } from "next";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  await requireSession();
  return <NotificationsView />;
}
