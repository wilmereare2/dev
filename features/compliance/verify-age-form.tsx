"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDateOfBirthInput,
  isAdult,
  parseDisplayDateOfBirth,
  toIsoDateString,
  validateAgeVerificationInput,
} from "@/lib/compliance/age-rules";
import { cn } from "@/lib/utils";

type VerifyAgeFormProps = {
  redirectTo?: string;
  alreadyVerified?: boolean;
};

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

const checkboxClassName =
  "mt-0.5 size-4 shrink-0 rounded border-border accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const checkboxRowClassName = "flex min-h-11 items-start gap-3 text-sm leading-relaxed";

export function VerifyAgeForm({ redirectTo = "/", alreadyVerified = false }: VerifyAgeFormProps) {
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
      return touched ? "Enter your date of birth." : null;
    }

    const parsed = parseDisplayDateOfBirth(dateOfBirth);
    if (!parsed.ok) return parsed.error;
    if (!isAdult(parsed.date)) {
      return "You must be at least 18 years old to use manuelaX.";
    }

    return null;
  }, [dateOfBirth, touched]);

  const policyIssue = useMemo(() => {
    if (!touched) return null;
    if (!acceptTerms || !acceptPrivacy) {
      return "Accept both agreements to continue.";
    }
    return null;
  }, [acceptTerms, acceptPrivacy, touched]);

  const canSubmit =
    !pending &&
    acceptTerms &&
    acceptPrivacy &&
    dateOfBirth.replace(/\D/g, "").length === 8 &&
    !dateIssue;

  async function restoreVerification() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/compliance/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rememberDevice }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }

      window.location.replace(redirectTo);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setError(null);

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const parsed = parseDisplayDateOfBirth(dateOfBirth);
    if (!parsed.ok) {
      setError(parsed.error);
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
          dateOfBirth: toIsoDateString(parsed.date),
          acceptTerms,
          acceptPrivacy,
          rememberDevice,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
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

  if (alreadyVerified) {
    return (
      <div className="w-full max-w-[420px] rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Welcome back</p>
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Continue to manuelaX
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your account is already age-verified. Restore access on this device to continue browsing.
        </p>

        <div className="mt-8 space-y-5">
          <label className={checkboxRowClassName}>
            <input
              type="checkbox"
              className={checkboxClassName}
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            <span>
              <span className="font-medium text-foreground">Remember this device</span>
              <span className="mt-1 block text-muted-foreground">
                Stay verified for 1 year. If unchecked, access expires after 30 days.
              </span>
            </span>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          ) : null}

          <Button type="button" className="w-full" disabled={pending} onClick={() => void restoreVerification()}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Continuing...
              </>
            ) : (
              "Continue to manuelaX"
            )}
          </Button>

          {session?.user ? (
            <p className="text-center text-sm text-muted-foreground">
              Signed in as {session.user.name ?? session.user.email}.
            </p>
          ) : null}
        </div>
      </div>
    );
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
        Enter your date of birth and accept our policies to enter the platform.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="dob" className="text-sm font-medium">
            Date of birth
          </label>
          <input
            id="dob"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            required
            placeholder="DD / MM / YYYY"
            value={dateOfBirth}
            onChange={(event) => {
              setDateOfBirth(formatDateOfBirthInput(event.target.value));
              setTouched(true);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            className={cn(inputClassName, dateIssue ? "border-red-500/40" : "")}
            aria-describedby="dob-help"
            aria-invalid={dateIssue ? true : undefined}
          />
          <p id="dob-help" className={cn("mt-2 text-xs", dateIssue ? "text-red-400" : "text-muted-foreground")}>
            {dateIssue ?? "You must be 18 or older. Future dates are not accepted."}
          </p>
        </div>

        <fieldset
          className={cn(
            "space-y-3 rounded-xl border bg-background/40 p-4",
            policyIssue ? "border-red-500/30" : "border-border/50",
          )}
        >
          <legend className="px-1 text-sm font-medium text-foreground">Before you continue</legend>

          <label className={checkboxRowClassName}>
            <input
              type="checkbox"
              className={checkboxClassName}
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

          <label className={checkboxRowClassName}>
            <input
              type="checkbox"
              className={checkboxClassName}
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
              </Link>
            </span>
          </label>

          {policyIssue ? <p className="text-sm text-red-400">{policyIssue}</p> : null}
        </fieldset>

        <label className={checkboxRowClassName}>
          <input
            type="checkbox"
            className={checkboxClassName}
            checked={rememberDevice}
            onChange={(event) => setRememberDevice(event.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">Remember this device</span>
            <span className="mt-1 block text-muted-foreground">
              Stay verified for 1 year. If unchecked, access expires after 30 days.
            </span>
          </span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="premium" className="w-full" disabled={!canSubmit} aria-disabled={!canSubmit}>
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
            Have an account?{" "}
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
