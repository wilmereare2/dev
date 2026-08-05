"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { clearAgeVerificationCookie } from "@/features/compliance/verify-age-form";
import { Loader2, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountPanelProps = {
  session: Session | null;
  googleAuthEnabled?: boolean;
};

type AuthMode = "signin" | "register";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

function AccountPanelContent({ session, googleAuthEnabled = false }: AccountPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [wantsToCreate, setWantsToCreate] = useState(false);
  const passwordResetComplete = searchParams.get("reset") === "1";

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setNotice("Email verified. You can sign in now.");
      setPendingVerificationEmail(null);
      setMode("signin");
    }

    if (searchParams.get("reset") === "1") {
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setMode("signin");
      const resetEmail = searchParams.get("email");
      if (resetEmail) {
        setEmail(resetEmail);
      }
      setNotice("Password updated. Sign in with your new password below.");
    }

    const verificationError = searchParams.get("error");
    const failedEmail = searchParams.get("email");
    if (verificationError === "verification-failed" && failedEmail) {
      setError("That verification link is invalid or expired.");
      setPendingVerificationEmail(failedEmail);
      setEmail(failedEmail);
      setMode("signin");
    }
  }, [searchParams]);

  async function resendVerification(targetEmail: string) {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not resend verification email.");
        return;
      }

      setNotice(`Verification email sent to ${targetEmail}.`);
    } catch {
      setError("Could not resend verification email.");
    } finally {
      setPending(false);
    }
  }

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
            Manage your library, settings, and subscription from your account hub.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
      </section>
    );
  }

  if (pendingVerificationEmail) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-accent">
          <Mail className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Verify email</p>
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{pendingVerificationEmail}</span>. Open it to
          activate your account, then sign in.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm">
          {notice ? (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            In local development, the verification link is printed in your terminal if email is not
            configured.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={pending}
              onClick={() => resendVerification(pendingVerificationEmail)}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Resend verification email
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingVerificationEmail(null);
                setMode("signin");
                setEmail(pendingVerificationEmail);
              }}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </section>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: name.trim() || undefined,
            wantsToCreate: mode === "register" ? wantsToCreate : undefined,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          email?: string;
          devAutoVerified?: boolean;
          message?: string;
        };
        if (!response.ok) {
          setError(payload.error ?? "Could not create account.");
          return;
        }

        const registeredEmail = payload.email ?? email.trim().toLowerCase();
        if (payload.devAutoVerified) {
          setNotice(payload.message ?? "Account created. You can sign in now.");
          setMode("signin");
          setEmail(registeredEmail);
          return;
        }

        setPendingVerificationEmail(registeredEmail);
        return;
      }

      let result: Awaited<ReturnType<typeof signIn>> | null = null;

      try {
        result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
      } catch {
        // NextAuth can throw when the callback URL is relative (missing AUTH_URL).
        result = { error: "CredentialsSignin", ok: false, status: 401, url: null, code: undefined };
      }

      if (result?.error) {
        const normalizedEmail = email.trim().toLowerCase();
        let status: { exists?: boolean; verified?: boolean; error?: string } | null = null;

        try {
          const statusResponse = await fetch("/api/auth/verification-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail }),
          });
          status = (await statusResponse.json()) as {
            exists?: boolean;
            verified?: boolean;
            error?: string;
          };

          if (!statusResponse.ok) {
            setError(status.error ?? "Sign-in failed. Try again in a moment.");
            return;
          }
        } catch {
          setError(
            "Sign-in failed. The server could not reach the database — wait a moment and try again.",
          );
          return;
        }

        if (status?.exists && !status?.verified) {
          setPendingVerificationEmail(normalizedEmail);
          setError("Verify your email before signing in.");
          return;
        }

        if (!status?.exists) {
          setError(
            "No account found for this email. After the database migration you may need to create your account again.",
          );
          return;
        }

        if (status?.exists && status?.verified) {
          setError("Incorrect password.");
          return;
        }

        setError("Invalid email or password. Create an account if you are new here.");
        return;
      }

      if (!result?.ok) {
        setError("Sign-in failed. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    setConfirmPassword("");
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-accent">
        <Shield className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {mode === "signin"
          ? "Sign in with your email and password."
          : "Register with your email. We will send a verification link before you can sign in."}
      </p>

      {notice ? (
        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {notice}
        </p>
      ) : null}

      <div className="mt-8 flex gap-2 rounded-xl border border-border/60 bg-surface/40 p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
            mode === "signin"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => switchMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
            mode === "register"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => switchMode("register")}
        >
          Register
        </button>
      </div>

      <form
        className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur-sm"
        onSubmit={handleSubmit}
      >
        {mode === "register" ? (
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className={inputClassName}
            />
          </div>
        ) : null}

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

        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            {mode === "signin" ? (
              <Link href="/account/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            ) : null}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={passwordResetComplete ? "new-password" : mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              passwordResetComplete
                ? "Enter the new password you just created"
                : mode === "register"
                  ? "At least 8 characters"
                  : "Your password"
            }
            className={inputClassName}
            key={passwordResetComplete ? "fresh-password" : "password"}
          />
          {passwordResetComplete ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Clear this field and type your new password manually. Do not rely on saved autofill.
            </p>
          ) : null}
        </div>

        {mode === "register" ? (
          <>
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
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={wantsToCreate}
                onChange={(event) => setWantsToCreate(event.target.checked)}
                className="mt-1 size-4"
              />
              <span>
                I want to upload content (photos, videos, text). Enables creator tools after you verify email.
              </span>
            </label>
          </>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      {googleAuthEnabled ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Continue with Google
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function AccountPanel(props: AccountPanelProps) {
  return <AccountPanelContent {...props} />;
}
