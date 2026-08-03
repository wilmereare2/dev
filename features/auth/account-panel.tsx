"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AccountPanelProps = {
  session: Session | null;
};

export function AccountPanel({ session }: AccountPanelProps) {
  if (session?.user) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        <div className="mt-8 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            Role:{" "}
            <span className="font-medium text-foreground">{session.user.role ?? "USER"}</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Dashboard, bookmarks, and history arrive in Phase 3. Credentials verification and email
            flows ship with that phase.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-accent">
        <Shield className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Phase 1</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Sign in
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Auth.js is wired with Prisma roles (Admin, Editor, Moderator, Viewer). Password verification
        and registration land in Phase 3.
      </p>

      <form
        className="mt-10 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm"
        action="/api/auth/signin"
        method="POST"
      >
        <div>
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            disabled
            placeholder="Available in Phase 3"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-muted-foreground opacity-70"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled
            placeholder="Available in Phase 3"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-muted-foreground opacity-70"
          />
        </div>
        <Button type="submit" disabled className="w-full">
          <Sparkles className="size-4" />
          Sign in (Phase 3)
        </Button>
      </form>
    </section>
  );
}
