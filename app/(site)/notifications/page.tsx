import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { NotificationsView } from "@/features/notifications/notifications-view";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/guards";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { hasVerifiedEmail } from "@/lib/auth/email-verification";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const session = await requireSession();

  const userId = await resolveDbUserId({
    id: session.user.id,
    email: session.user.email,
  });

  // The notification channel is one of the two features that need a verified
  // email. Explain that here rather than rendering an empty list.
  if (!(await hasVerifiedEmail(userId))) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Verify your email to turn on notifications
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Notifications are delivered to a confirmed address, so this channel stays off until your
          email is verified. Everything else on your account keeps working.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="premium">
            <Link href="/account?verify=1&redirect=%2Fnotifications">Verify my email</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/explore">Back to browsing</Link>
          </Button>
        </div>
      </section>
    );
  }

  return <NotificationsView />;
}
