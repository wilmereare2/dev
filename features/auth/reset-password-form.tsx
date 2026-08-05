"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setEmail(searchParams.get("email") ?? "");
    setToken(searchParams.get("token") ?? "");
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email || !token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token,
          password,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not reset password.");
        return;
      }

      setCompleted(true);
      setNotice(payload.message ?? "Password updated. You can sign in now.");
    } catch {
      setError("Could not reset password. Try again.");
    } finally {
      setPending(false);
    }
  }

  const signInHref = `/account?reset=1&email=${encodeURIComponent(email.trim().toLowerCase())}`;

  if (completed) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-accent">
          <Shield className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Password updated
        </h1>
        <div className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm">
          <p className="text-sm text-accent">{notice}</p>
          <p className="text-sm text-muted-foreground">
            Go to sign in and enter the <strong className="text-foreground">new password you just created</strong>.
            Your browser may still show your old password — delete it and type the new one manually.
          </p>
          <Button asChild className="w-full">
            <Link href={signInHref}>Continue to sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-accent">
        <Shield className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Reset password
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Choose a new password for your account.
      </p>

      <form
        className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
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
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/account/forgot-password" className="text-accent hover:underline">
          Request a new reset link
        </Link>
      </p>
    </section>
  );
}
