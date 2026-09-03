"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isAdult,
  parseDateOfBirthParts,
  toIsoDateString,
  validateAgeVerificationParts,
} from "@/lib/compliance/age-rules";
import { cn } from "@/lib/utils";

type VerifyAgeFormProps = {
  redirectTo?: string;
  alreadyVerified?: boolean;
  vendorPending?: boolean;
  signedIn?: boolean;
  selfAttestationAllowed?: boolean;
  vendorVerificationConfigured?: boolean;
  strictVerification?: boolean;
  requiresSignIn?: boolean;
};

const checkboxClassName =
  "mt-0.5 size-4 shrink-0 rounded border-border accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

const checkboxRowClassName = "flex min-h-10 items-start gap-3 text-sm leading-snug";

const cardClassName =
  "w-full rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-2xl backdrop-blur-md sm:p-8";

const LEAVE_SITE_URL = "https://www.google.com";

type DateOfBirthFieldsProps = {
  day: string;
  month: string;
  year: string;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onBlur: () => void;
  error: string | null;
};

function DateOfBirthFields({
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
  onBlur,
  error,
}: DateOfBirthFieldsProps) {
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  function handleDayChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    onDayChange(digits);
    if (digits.length === 2) monthRef.current?.focus();
  }

  function handleMonthChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    onMonthChange(digits);
    if (digits.length === 2) yearRef.current?.focus();
  }

  function handleYearChange(raw: string) {
    onYearChange(raw.replace(/\D/g, "").slice(0, 4));
  }

  return (
    <div>
      <p id="dob-label" className="text-sm font-medium">
        Date of birth
      </p>
      <div
        role="group"
        aria-labelledby="dob-label"
        className="mt-2 grid grid-cols-3 gap-2 sm:gap-3"
      >
        <div>
          <label htmlFor="dob-day" className="sr-only">
            Day
          </label>
          <Input
            id="dob-day"
            type="text"
            inputMode="numeric"
            autoComplete="bday-day"
            placeholder="DD"
            value={day}
            onChange={(event) => handleDayChange(event.target.value)}
            onBlur={onBlur}
            maxLength={2}
            className="text-center tabular-nums"
            error={Boolean(error)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div>
          <label htmlFor="dob-month" className="sr-only">
            Month
          </label>
          <Input
            ref={monthRef}
            id="dob-month"
            type="text"
            inputMode="numeric"
            autoComplete="bday-month"
            placeholder="MM"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
            onBlur={onBlur}
            maxLength={2}
            className="text-center tabular-nums"
            error={Boolean(error)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div>
          <label htmlFor="dob-year" className="sr-only">
            Year
          </label>
          <Input
            ref={yearRef}
            id="dob-year"
            type="text"
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder="YYYY"
            value={year}
            onChange={(event) => handleYearChange(event.target.value)}
            onBlur={onBlur}
            maxLength={4}
            className="text-center tabular-nums"
            error={Boolean(error)}
            aria-invalid={error ? true : undefined}
          />
        </div>
      </div>
      {error ? (
        <p id="dob-help" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : (
        <p id="dob-help" className="mt-2 text-xs text-muted-foreground">
          You must be 18 or older.
        </p>
      )}
    </div>
  );
}

function PolicyAcceptance({
  acceptTerms,
  acceptPrivacy,
  onTermsChange,
  onPrivacyChange,
  issue,
}: {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  issue: string | null;
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border bg-background/40 p-4",
        issue ? "border-red-500/30" : "border-border/50",
      )}
    >
      <label className={checkboxRowClassName}>
        <input
          type="checkbox"
          className={checkboxClassName}
          checked={acceptTerms}
          onChange={(event) => onTermsChange(event.target.checked)}
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
          onChange={(event) => onPrivacyChange(event.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="font-medium text-accent hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {issue ? <p className="text-sm text-red-400">{issue}</p> : null}
    </div>
  );
}

function FormFooterLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="space-y-3 pt-1 text-center text-sm">
      {signedIn ? null : (
        <p className="text-muted-foreground">
          Have an account?{" "}
          <Link href="/account" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      )}
      <p>
        <a
          href={LEAVE_SITE_URL}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Leave site
        </a>
      </p>
    </div>
  );
}

export function VerifyAgeForm({
  redirectTo = "/",
  alreadyVerified = false,
  vendorPending = false,
  signedIn = false,
  selfAttestationAllowed = true,
  vendorVerificationConfigured = false,
  strictVerification = false,
  requiresSignIn = false,
}: VerifyAgeFormProps) {
  const { data: session } = useSession();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [touched, setTouched] = useState(false);

  const validation = useMemo(
    () =>
      validateAgeVerificationParts({
        day,
        month,
        year,
        acceptTerms,
        acceptPrivacy,
      }),
    [day, month, year, acceptTerms, acceptPrivacy],
  );

  const dateIssue = useMemo(() => {
    if (!day && !month && !year) {
      return touched ? "Enter your date of birth." : null;
    }

    const parsed = parseDateOfBirthParts(day, month, year);
    if (!parsed.ok) return parsed.error;
    if (!isAdult(parsed.date)) {
      return "You must be at least 18 years old to use manuelaX.";
    }

    return null;
  }, [day, month, year, touched]);

  const policyIssue = useMemo(() => {
    if (!touched) return null;
    if (!acceptTerms || !acceptPrivacy) {
      return "Accept both agreements to continue.";
    }
    return null;
  }, [acceptTerms, acceptPrivacy, touched]);

  const dobComplete = day.length >= 1 && month.length >= 1 && year.length === 4;
  const canSubmit = !pending && acceptTerms && acceptPrivacy && dobComplete && !dateIssue;

  function markTouched() {
    setTouched(true);
    setError(null);
  }

  async function startVendorVerification() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/user/age-verification", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        verificationUrl?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not start ID verification.");
        return;
      }

      if (payload.verificationUrl) {
        window.location.assign(payload.verificationUrl);
        return;
      }

      setError("Verification provider did not return a session URL.");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

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

    const parsed = parseDateOfBirthParts(day, month, year);
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
      <div className={cardClassName}>
        <div className="flex items-center gap-2 text-accent">
          <ShieldCheck className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Welcome back</p>
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Continue to manuelaX
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your account is already verified. Restore access on this device to keep browsing.
        </p>

        {vendorPending ? (
          <p className="mt-4 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
            We are processing your ID verification. If this message persists, refresh in a moment or contact
            support.
          </p>
        ) : null}

        <div className="mt-8 space-y-5">
          <label className={checkboxRowClassName}>
            <input
              type="checkbox"
              className={checkboxClassName}
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            <span className="text-muted-foreground">
              Stay verified on this device for 1 year
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

          <Button
            type="button"
            variant="premium"
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => void restoreVerification()}
          >
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

          <FormFooterLinks signedIn={Boolean(session?.user)} />
        </div>
      </div>
    );
  }

  if (requiresSignIn) {
    const signInHref = `/account?redirect=${encodeURIComponent(`/verify-age?redirect=${encodeURIComponent(redirectTo)}`)}`;

    return (
      <div className={cardClassName}>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Sign in to verify your age
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Verify your age with a secure ID check to explore creators, releases, and member features.
        </p>

        <div className="mt-8 space-y-4">
          <Button asChild variant="premium" size="lg" className="w-full">
            <Link href={signInHref}>Sign in to continue</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href={signInHref} className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
          <FormFooterLinks signedIn={false} />
        </div>
      </div>
    );
  }

  const showSelfAttestation = selfAttestationAllowed;
  const showVendorVerification = vendorVerificationConfigured && signedIn;

  return (
    <div className={cardClassName}>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Adults-only platform
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {strictVerification
          ? "Complete ID verification to explore creators, releases, and member features."
          : "Please confirm that you are 18+ or older to continue."}
      </p>

      {showVendorVerification ? (
        <div className="mt-6 space-y-4 rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-sm font-medium text-foreground">
            {strictVerification ? "Verify with government ID" : "Prefer stronger verification?"}
          </p>

          {!showSelfAttestation ? (
            <PolicyAcceptance
              acceptTerms={acceptTerms}
              acceptPrivacy={acceptPrivacy}
              onTermsChange={(checked) => {
                setAcceptTerms(checked);
                markTouched();
              }}
              onPrivacyChange={(checked) => {
                setAcceptPrivacy(checked);
                markTouched();
              }}
              issue={policyIssue}
            />
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending || (!showSelfAttestation && (!acceptTerms || !acceptPrivacy))}
            onClick={() => void startVendorVerification()}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Starting verification...
              </>
            ) : (
              "Verify with ID"
            )}
          </Button>
        </div>
      ) : null}

      {showSelfAttestation ? (
        <form onSubmit={onSubmit} className={cn("space-y-5", showVendorVerification ? "mt-6" : "mt-8")} noValidate>
          <DateOfBirthFields
            day={day}
            month={month}
            year={year}
            onDayChange={(value) => {
              setDay(value);
              markTouched();
            }}
            onMonthChange={(value) => {
              setMonth(value);
              markTouched();
            }}
            onYearChange={(value) => {
              setYear(value);
              markTouched();
            }}
            onBlur={() => setTouched(true)}
            error={dateIssue}
          />

          <PolicyAcceptance
            acceptTerms={acceptTerms}
            acceptPrivacy={acceptPrivacy}
            onTermsChange={(checked) => {
              setAcceptTerms(checked);
              markTouched();
            }}
            onPrivacyChange={(checked) => {
              setAcceptPrivacy(checked);
              markTouched();
            }}
            issue={policyIssue}
          />

          <label className={checkboxRowClassName}>
            <input
              type="checkbox"
              className={checkboxClassName}
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            <span className="text-muted-foreground">Stay verified on this device for 1 year</span>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="premium"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
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
          ) : null}

          <FormFooterLinks signedIn={Boolean(session?.user)} />
        </form>
      ) : null}

      {!showSelfAttestation && !showVendorVerification ? (
        <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          Age verification is temporarily unavailable. Please try again later or contact support.
        </p>
      ) : null}

      {error && !showSelfAttestation ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export async function clearAgeVerificationCookie() {
  await fetch("/api/compliance/clear", { method: "POST" });
}
