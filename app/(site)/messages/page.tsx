import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Messages",
  description: `Support and account messages on ${APP_NAME}.`,
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-accent">
        <MessageSquare className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Inbox</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Messages</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Direct creator messaging is coming soon. For now, use notifications for account updates and
        contact support for help with billing or verification.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/60 bg-surface/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-accent">
            <Shield className="size-4" aria-hidden />
            <h2 className="font-semibold text-foreground">Account updates</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Verification, billing, moderation, and creator workflow alerts appear in your notification
            bell.
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/settings/notifications">Notification settings</Link>
          </Button>
        </article>

        <article className="rounded-2xl border border-border/60 bg-surface/50 p-6 backdrop-blur-sm">
          <h2 className="font-semibold text-foreground">Need help?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Reach the manuelaX team for billing, DMCA, or account issues. We typically respond within
            one business day.
          </p>
          <Button asChild variant="premium" className="mt-4">
            <Link href="/contact">Contact support</Link>
          </Button>
        </article>
      </div>
    </section>
  );
}
