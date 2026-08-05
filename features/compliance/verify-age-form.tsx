"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { validateAgeVerificationInput } from "@/lib/compliance/age-rules";

type VerifyAgeFormProps = {
  redirectTo?: string;
};

export function VerifyAgeForm({ redirectTo = "/" }: VerifyAgeFormProps) {
  const { data: session } = useSession();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const clientCheck = validateAgeVerificationInput({
      dateOfBirth,
      acceptTerms,
      acceptPrivacy,
    });
    if (!clientCheck.ok) {
      setError(clientCheck.error);
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
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        manuelaX is an 18+ platform. Enter your date of birth and accept our policies to continue.
      </p>

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
          onChange={(event) => setDateOfBirth(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(event) => setAcceptPrivacy(event.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(event) => setRememberDevice(event.target.checked)}
        />
        <span>Remember this device for 1 year (otherwise 30 days)</span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Verifying..." : "Continue to manuelaX"}
      </Button>

      {session?.user ? (
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.name ?? session.user.email}. Verification applies to this browser.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/account" className="text-accent hover:underline">
            Sign in or register
          </Link>
        </p>
      )}
    </form>
  );
}

export async function clearAgeVerificationCookie() {
  await fetch("/api/compliance/clear", { method: "POST" });
}
