"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";

type EmailVerificationPanelProps = {
  email: string;
  notice?: string | null;
  error?: string | null;
  verificationUrl?: string | null;
  emailSent?: boolean | null;
  smsEnabled?: boolean;
  onResend: () => Promise<void>;
  onVerified: () => void;
  onBackToSignIn: () => void;
  pending?: boolean;
};

export function EmailVerificationPanel({
  email,
  notice,
  error,
  verificationUrl,
  emailSent,
  smsEnabled = false,
  onResend,
  onVerified,
  onBackToSignIn,
  pending = false,
}: EmailVerificationPanelProps) {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"idle" | "sent">("idle");

  async function verifyEmailCode(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);
    setLocalNotice(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setLocalError(payload.error ?? "Could not verify code.");
        return;
      }
      setLocalNotice(payload.message ?? "Email verified. You can sign in now.");
      onVerified();
    } catch {
      setLocalError("Could not verify code. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendPhoneCode() {
    setLocalError(null);
    setLocalNotice(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/send-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone.trim() }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setLocalError(payload.error ?? "Could not send text message.");
        return;
      }
      setPhoneStep("sent");
      setLocalNotice(payload.message ?? "Code sent by SMS.");
    } catch {
      setLocalError("Could not send text message.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyPhoneCode(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);
    setLocalNotice(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: phone.trim(), code: phoneCode.trim() }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setLocalError(payload.error ?? "Could not verify phone.");
        return;
      }
      setLocalNotice(payload.message ?? "Phone verified.");
    } catch {
      setLocalError("Could not verify phone.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = localError ?? error;
  const displayNotice = localNotice ?? notice;

  return (
    <AuthSplitLayout>
      <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2 text-accent">
          <Mail className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Verify email</p>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Enter your verification code
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {emailSent === false ? (
            <>
              We could not deliver email to{" "}
              <span className="font-medium text-foreground">{email}</span> yet. Fix{" "}
              <code className="text-xs">EMAIL_SERVER</code> on your host, then resend. Account
              activation requires a delivered code in production.
            </>
          ) : (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>. Enter it below to
              activate your account.
            </>
          )}
        </p>

        <form className="mt-6 space-y-4" onSubmit={verifyEmailCode}>
          <div>
            <label htmlFor="email-code" className="text-sm font-medium text-foreground">
              Email verification code
            </label>
            <input
              id="email-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-center text-lg tracking-[0.35em] text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </div>

          {displayNotice ? (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {displayNotice}
            </p>
          ) : null}
          {displayError ? (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {displayError}
            </p>
          ) : null}

          {verificationUrl ? (
            <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">Local dev fallback</p>
              <Link href={verificationUrl} className="font-medium text-accent underline underline-offset-2">
                Open verification link
              </Link>
            </div>
          ) : null}

          <Button type="submit" disabled={submitting || code.length !== 6} className="w-full">
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Verify email
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" disabled={pending || submitting} onClick={onResend}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Resend code
          </Button>
          <Button type="button" variant="outline" onClick={onBackToSignIn}>
            Back to sign in
          </Button>
        </div>

        {smsEnabled ? (
          <div className="mt-8 border-t border-border/60 pt-6">
            <div className="flex items-center gap-2 text-accent">
              <Smartphone className="size-4" aria-hidden />
              <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">
                Optional phone verification
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              After email verification, you can also verify a mobile number by SMS.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={phoneStep === "sent" ? verifyPhoneCode : (event) => {
                event.preventDefault();
                void sendPhoneCode();
              }}
            >
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 123 4567"
                className="h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
              />
              {phoneStep === "sent" ? (
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="SMS code"
                  className="h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-center text-lg tracking-[0.35em] text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
                />
              ) : null}
              <Button type="submit" variant="secondary" disabled={submitting || !phone.trim()}>
                {phoneStep === "sent" ? "Verify phone" : "Send SMS code"}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </AuthSplitLayout>
  );
}
