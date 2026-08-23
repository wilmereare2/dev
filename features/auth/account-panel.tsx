"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "next-auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { clearAgeVerificationCookie } from "@/features/compliance/verify-age-form";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { EmailVerificationPanel } from "@/features/auth/email-verification-panel";
import { RegisterOnboarding, type RegisterFormValues } from "@/features/auth/register-onboarding";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AccountPanelProps = {
  session: Session | null;
  googleAuthEnabled?: boolean;
  phoneVerificationRequired?: boolean;
  smsVerificationAvailable?: boolean;
};

type AuthMode = "signin" | "register";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

const emptyRegisterValues: RegisterFormValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  dateOfBirth: "",
  gender: "",
  country: "",
  race: "",
  hobbies: "",
  phone: "",
  telegram: "",
  whatsApp: "",
  zangi: "",
  wantsToCreate: false,
};

function AccountPanelContent({
  session,
  googleAuthEnabled = false,
  phoneVerificationRequired = false,
  smsVerificationAvailable = false,
}: AccountPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerValues, setRegisterValues] = useState<RegisterFormValues>(emptyRegisterValues);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState<boolean | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const passwordResetComplete = searchParams.get("reset") === "1";

  useEffect(() => {
    if (searchParams.get("password")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("password");
      const next = params.toString();
      router.replace(next ? `/account?${next}` : "/account");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setNotice("Email verified. You can sign in now.");
      setPendingVerificationEmail(null);
      setVerificationUrl(null);
      setVerificationEmailSent(null);
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
      setVerificationEmailSent(null);
      setEmail(failedEmail);
      setMode("signin");
    }

    const urlEmail = failedEmail?.trim().toLowerCase();
    if (urlEmail && !verificationError && searchParams.get("verified") !== "1") {
      setEmail(urlEmail);
      void (async () => {
        try {
          const statusResponse = await fetch("/api/auth/verification-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: urlEmail }),
          });
          const status = (await statusResponse.json()) as {
            exists?: boolean;
            verified?: boolean;
          };
          if (status.exists && !status.verified) {
            setPendingVerificationEmail(urlEmail);
            setVerificationEmailSent(null);
            setError(null);
          }
        } catch {
          // Ignore — user can still sign in or register manually.
        }
      })();
    }
  }, [searchParams]);

  const resendVerification = useCallback(async (targetEmail: string) => {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        verifyUrl?: string;
        emailSent?: boolean;
        deliveryError?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not resend verification email.");
        return;
      }

      setNotice(
        payload.emailSent
          ? (payload.message ?? `Verification code sent to ${targetEmail}.`)
          : (payload.deliveryError ?? payload.message ?? "Could not deliver verification email."),
      );
      setVerificationEmailSent(payload.emailSent ?? false);
      if (payload.verifyUrl) {
        setVerificationUrl(payload.verifyUrl);
      }
      if (payload.emailSent === false && payload.deliveryError) {
        setError(payload.deliveryError);
      }
    } catch {
      setError("Could not resend verification email.");
    } finally {
      setPending(false);
    }
  }, []);

  const completeRegistrationSignIn = useCallback(
    async (targetEmail: string, registrationPassword: string) => {
      setPendingVerificationEmail(null);
      setVerificationUrl(null);
      setVerificationEmailSent(null);
      setPendingPhone(null);
      setError(null);
      setEmail(targetEmail);
      setMode("signin");

      if (!registrationPassword) {
        setNotice("Account ready. Sign in with your email and password.");
        return;
      }

      setPending(true);
      try {
        let result: Awaited<ReturnType<typeof signIn>> | null = null;

        try {
          result = await signIn("credentials", {
            email: targetEmail.trim().toLowerCase(),
            password: registrationPassword,
            redirect: false,
          });
        } catch {
          result = { error: "CredentialsSignin", ok: false, status: 401, url: null, code: undefined };
        }

        if (result?.ok) {
          setRegisterValues(emptyRegisterValues);
          router.push("/");
          router.refresh();
          return;
        }

        setPassword(registrationPassword);
        setNotice("Email verified. Sign in to continue.");
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  if (session?.user) {
    return (
      <AuthSplitLayout>
        <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
          <div className="flex items-center gap-2 text-accent">
            <Shield className="size-4" aria-hidden />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back</h1>
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

  if (pendingVerificationEmail) {
    return (
      <EmailVerificationPanel
        email={pendingVerificationEmail}
        registeredPhone={pendingPhone}
        notice={notice}
        error={error}
        verificationUrl={verificationUrl}
        emailSent={verificationEmailSent}
        smsEnabled={smsVerificationAvailable}
        phoneVerificationRequired={phoneVerificationRequired}
        pending={pending}
        onResend={() => resendVerification(pendingVerificationEmail)}
        onVerified={() => {
          void completeRegistrationSignIn(pendingVerificationEmail, registerValues.password);
        }}
        onBackToSignIn={() => {
          setPendingVerificationEmail(null);
          setVerificationUrl(null);
          setVerificationEmailSent(null);
          setMode("signin");
          setEmail(pendingVerificationEmail);
          setPassword(registerValues.password);
        }}
      />
    );
  }

  async function handleRegisterSubmit() {
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerValues.username,
          name: registerValues.name.trim(),
          dateOfBirth: registerValues.dateOfBirth,
          gender: registerValues.gender,
          country: registerValues.country,
          race: registerValues.race,
          hobbies: registerValues.hobbies,
          email: registerValues.email.trim().toLowerCase(),
          phone: registerValues.phone,
          password: registerValues.password,
          telegram: registerValues.telegram,
          whatsApp: registerValues.whatsApp,
          zangi: registerValues.zangi,
          wantsToCreate: registerValues.wantsToCreate,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        code?: string;
        email?: string;
        devAutoVerified?: boolean;
        verifyUrl?: string;
        emailSent?: boolean;
        deliveryError?: string;
        message?: string;
        resumed?: boolean;
      };
      if (!response.ok) {
        if (payload.code === "ALREADY_REGISTERED") {
          setMode("signin");
          setEmail(registerValues.email.trim().toLowerCase());
          setNotice(payload.error ?? "This email is already registered. Sign in to continue.");
          return;
        }
        setError(payload.error ?? "Could not create account.");
        return;
      }

      const registeredEmail = payload.email ?? registerValues.email.trim().toLowerCase();
      if (payload.devAutoVerified) {
        await completeRegistrationSignIn(registeredEmail, registerValues.password);
        return;
      }

      setPendingVerificationEmail(registeredEmail);
      setPendingPhone(registerValues.phone.trim() || null);
      setVerificationUrl(payload.verifyUrl ?? null);
      setVerificationEmailSent(payload.emailSent ?? null);
      if (payload.deliveryError) {
        setError(payload.deliveryError);
      } else if (payload.message) {
        setNotice(payload.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleSignInSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
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
          setVerificationEmailSent(null);
          setError(null);
          setNotice(null);
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
    if (nextMode === "signin") {
      setConfirmPassword("");
    }
  }

  return (
    <AuthSplitLayout variant={mode === "register" ? "register" : "account"}>
      <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="flex items-center gap-2 text-accent">
        <Shield className="size-4" aria-hidden />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {mode === "signin"
          ? "Sign in with your email and password."
          : "Set up your account in three quick steps. Other members reach you by @username in chat only."}
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

      {mode === "register" ? (
        <div className="mt-6">
          <RegisterOnboarding
            values={registerValues}
            onChange={(patch) => setRegisterValues((current) => ({ ...current, ...patch }))}
            onSubmit={handleRegisterSubmit}
            pending={pending}
            error={error}
          />
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSignInSubmit}>
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
              <Link href="/account/forgot-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={passwordResetComplete ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                passwordResetComplete
                  ? "Enter the new password you just created"
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

          {error ? (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full" variant="premium">
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}

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
      </div>
    </AuthSplitLayout>
  );
}

export function AccountPanel(props: AccountPanelProps) {
  return <AccountPanelContent {...props} />;
}
