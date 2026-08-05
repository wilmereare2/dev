"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdult, parseDateOfBirth, validateAgeVerificationInput } from "@/lib/compliance/age-rules";
import { cn } from "@/lib/utils";

type VerifyAgeFormProps = {
  redirectTo?: string;
};

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

export function VerifyAgeForm({ redirectTo = "/" }: VerifyAgeFormProps) {
  const { data: session } = useSession();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [touched, setTouched] = useState(false);

  const validation = useMemo(
    () =>
      validateAgeVerificationInput({
        dateOfBirth,
        acceptTerms,
        acceptPrivacy,
      }),
    [dateOfBirth, acceptTerms, acceptPrivacy],
  );

  const dateIssue = useMemo(() => {
    if (!dateOfBirth) {
      return touched ? "Select your date of birth." : null;
    }

    const parsed = parseDateOfBirth(dateOfBirth);
    if (!parsed.ok) return parsed.error;
    if (!isAdult(parsed.date)) {
      return "You must be at least 18 years old to use manuelaX.";
    }

    return null;
  }, [dateOfBirth, touched]);

  const policyIssue = useMemo(() => {
    if (!touched) return null;
    if (!acceptTerms || !acceptPrivacy) {
      return "Accept the Terms of Service and Privacy Policy to continue.";
    }
    return null;
  }, [acceptTerms, acceptPrivacy, touched]);

  const canSubmit = validation.ok && !pending;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setError(null);

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setPending(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/compliance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth,
          acceptTerms,
          acceptPrivacy,
          rememberDevice,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Verification failed.");
        return;
      }

      window.location.replace(redirectTo);
      return;
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError("Verification timed out. Please try again.");
      } else {
        setError("Could not reach the server. Try again.");
      }
    } finally {
      window.clearTimeout(timeout);
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <div className="flex items-center gap-2 text-accent">
        <ShieldCheck className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Age verification</p>
      </div>

      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Confirm you are 18+
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        manuelaX is an adults-only platform. Enter your date of birth and accept our policies to
        continue.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="dob" className="text-sm font-medium">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={dateOfBirth}
            onChange={(event) => {
              setDateOfBirth(event.target.value);
              setTouched(true);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            className={cn(inputClassName, dateIssue ? "border-red-500/40" : "")}
            aria-describedby={dateIssue ? "dob-help" : undefined}
            aria-invalid={dateIssue ? true : undefined}
          />
          {dateIssue ? (
            <p id="dob-help" className="mt-2 text-sm text-red-400">
              {dateIssue}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "space-y-3 rounded-xl border bg-background/40 p-4",
            policyIssue ? "border-red-500/30" : "border-border/50",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Required agreements
          </p>

          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptTerms}
              onChange={(event) => {
                setAcceptTerms(event.target.checked);
                setTouched(true);
                setError(null);
              }}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-accent hover:underline">
                Terms of Service
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptPrivacy}
              onChange={(event) => {
                setAcceptPrivacy(event.target.checked);
                setTouched(true);
                setError(null);
              }}
            />
            <span>
              I agree to the{" "}
              <Link href="/privacy" className="font-medium text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              and essential cookies used for sign-in and preferences.
            </span>
          </label>

          {policyIssue ? <p className="text-sm text-red-400">{policyIssue}</p> : null}
        </div>

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1"
            checked={rememberDevice}
            onChange={(event) => setRememberDevice(event.target.checked)}
          />
          <span>Remember this device for 1 year (otherwise 30 days)</span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Verifying...
            </>
          ) : (
            "Continue to manuelaX"
          )}
        </Button>

        {session?.user ? (
          <p className="text-center text-sm text-muted-foreground">
            Signed in as {session.user.name ?? session.user.email}.
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Already verified elsewhere?{" "}
            <Link href="/account" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}

export async function clearAgeVerificationCookie() {
  await fetch("/api/compliance/clear", { method: "POST" });
}
