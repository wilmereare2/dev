"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setResetUrl(null);
    setEmailSent(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
        emailSent?: boolean;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not send reset email.");
        return;
      }

      setNotice(payload.message ?? "If an account exists for that email, we sent password reset instructions.");
      setEmailSent(payload.emailSent ?? false);
      if (payload.resetUrl) {
        setResetUrl(payload.resetUrl);
      }
    } catch {
      setError("Could not send reset email. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-accent">
        <Shield className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Forgot password
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        We&apos;ll email you a secure link. You must open that link before you can choose a new password.
      </p>

      {notice ? (
        <div className="mt-4 space-y-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          <p>{notice}</p>
          {emailSent ? (
            <p className="text-muted-foreground">
              The reset link was sent by email. Open it from your inbox, then return here to sign in.
            </p>
          ) : null}
          {resetUrl ? (
            <div className="space-y-2 border-t border-accent/20 pt-3">
              <p className="font-medium text-foreground">
                Local testing only — email was not sent to Outlook.
              </p>
              <p className="text-muted-foreground">
                Configure <code className="text-xs">EMAIL_SERVER</code> in{" "}
                <code className="text-xs">.env</code> to deliver real messages. Until then, use this
                one-time link:
              </p>
              <p>
                <Link href={resetUrl} className="font-medium underline underline-offset-2">
                  Open password reset link
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm"
        onSubmit={handleSubmit}
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
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClassName}
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/account" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
