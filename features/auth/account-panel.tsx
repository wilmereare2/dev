"use client";

import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccountSignInForm } from "@/features/auth/account-sign-in-form";
import { AccountSignedIn } from "@/features/auth/account-signed-in";
import { EmailVerificationPanel } from "@/features/auth/email-verification-panel";
import { RegisterOnboarding } from "@/features/auth/register-onboarding";
import { useAccountAuth } from "@/features/auth/use-account-auth";

type AccountPanelProps = {
  session: Session | null;
  googleAuthEnabled?: boolean;
  phoneVerificationRequired?: boolean;
  smsVerificationAvailable?: boolean;
};

function AccountPanelContent({
  session,
  googleAuthEnabled = false,
  phoneVerificationRequired = false,
  smsVerificationAvailable = false,
}: AccountPanelProps) {
  const auth = useAccountAuth();

  if (session?.user) {
    return <AccountSignedIn session={session} />;
  }

  if (auth.pendingVerificationEmail) {
    return (
      <EmailVerificationPanel
        email={auth.pendingVerificationEmail}
        registeredPhone={auth.pendingPhone}
        notice={auth.notice}
        error={auth.error}
        verificationUrl={auth.verificationUrl}
        emailSent={auth.verificationEmailSent}
        smsEnabled={smsVerificationAvailable}
        phoneVerificationRequired={phoneVerificationRequired}
        pending={auth.pending}
        onResend={() => auth.resendVerification(auth.pendingVerificationEmail!)}
        onVerified={() => {
          void auth.completeRegistrationSignIn(
            auth.pendingVerificationEmail!,
            auth.registerValues.password,
          );
        }}
        onBackToSignIn={auth.backToSignInFromVerification}
      />
    );
  }

  return (
    <AuthSplitLayout variant={auth.mode === "register" ? "register" : "account"}>
      <div className="rounded-2xl border border-border/60 bg-surface/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center gap-2 text-accent">
          <Shield className="size-4" aria-hidden />
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em]">Account</p>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {auth.mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {auth.mode === "signin"
            ? "Sign in with your email and password."
            : "Pick a username and you are in. Other members reach you by @username in chat only."}
        </p>

        {auth.notice ? (
          <p className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {auth.notice}
          </p>
        ) : null}

        <div className="mt-8 flex gap-2 rounded-xl border border-border/60 bg-surface/40 p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
              auth.mode === "signin"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => auth.switchMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
              auth.mode === "register"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => auth.switchMode("register")}
          >
            Register
          </button>
        </div>

        {auth.mode === "register" ? (
          <div className="mt-6">
            <RegisterOnboarding
              values={auth.registerValues}
              onChange={(patch) =>
                auth.setRegisterValues((current) => ({ ...current, ...patch }))
              }
              onSubmit={auth.handleRegisterSubmit}
              pending={auth.pending}
              error={auth.error}
            />
          </div>
        ) : (
          <AccountSignInForm
            email={auth.email}
            password={auth.password}
            error={auth.error}
            pending={auth.pending}
            passwordResetComplete={auth.passwordResetComplete}
            onEmailChange={auth.setEmail}
            onPasswordChange={auth.setPassword}
            onSubmit={auth.handleSignInSubmit}
          />
        )}

        {googleAuthEnabled ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={auth.pending}
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
