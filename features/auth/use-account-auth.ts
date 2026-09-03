"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  EMPTY_REGISTER_VALUES,
  type AuthMode,
} from "@/features/auth/account-constants";
import type { RegisterFormValues } from "@/features/auth/register-onboarding";

async function fetchVerificationStatus(email: string) {
  const response = await fetch("/api/auth/verification-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = (await response.json()) as {
    exists?: boolean;
    verified?: boolean;
    error?: string;
  };
  return { ok: response.ok, ...payload };
}

export function useAccountAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerValues, setRegisterValues] = useState<RegisterFormValues>(EMPTY_REGISTER_VALUES);
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
          const status = await fetchVerificationStatus(urlEmail);
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
          setRegisterValues(EMPTY_REGISTER_VALUES);
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
        let status: Awaited<ReturnType<typeof fetchVerificationStatus>> | null = null;

        try {
          status = await fetchVerificationStatus(normalizedEmail);
          if (!status.ok) {
            setError(status.error ?? "Sign-in failed. Try again in a moment.");
            return;
          }
        } catch {
          setError(
            "Sign-in failed. The server could not reach the database — wait a moment and try again.",
          );
          return;
        }

        if (status.exists && !status.verified) {
          setPendingVerificationEmail(normalizedEmail);
          setVerificationEmailSent(null);
          setError(null);
          setNotice(null);
          return;
        }

        if (!status.exists) {
          setError(
            "No account found for this email. After the database migration you may need to create your account again.",
          );
          return;
        }

        if (status.exists && status.verified) {
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
  }

  function backToSignInFromVerification() {
    if (!pendingVerificationEmail) return;
    setPendingVerificationEmail(null);
    setVerificationUrl(null);
    setVerificationEmailSent(null);
    setMode("signin");
    setEmail(pendingVerificationEmail);
    setPassword(registerValues.password);
  }

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    registerValues,
    setRegisterValues,
    error,
    notice,
    pending,
    pendingVerificationEmail,
    verificationUrl,
    verificationEmailSent,
    pendingPhone,
    passwordResetComplete,
    resendVerification,
    completeRegistrationSignIn,
    handleRegisterSubmit,
    handleSignInSubmit,
    switchMode,
    backToSignInFromVerification,
  };
}
