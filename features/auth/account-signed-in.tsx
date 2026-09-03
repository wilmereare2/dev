"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Shield } from "lucide-react";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { clearAgeVerificationCookie } from "@/features/compliance/verify-age-form";

type AccountSignedInProps = {
  session: Session;
};

export function AccountSignedIn({ session }: AccountSignedInProps) {
  return (
    <AuthSplitLayout>
      <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2 text-accent">
          <Shield className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-foreground">{session.user.role ?? "USER"}</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Manage your library, settings, and subscription from your account hub.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/create">Create & upload</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/library">Library</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/settings/profile">Settings</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/subscriptions">Subscriptions</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await clearAgeVerificationCookie();
                await signOut({ callbackUrl: "/account" });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
