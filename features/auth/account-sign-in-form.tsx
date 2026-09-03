"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_INPUT_CLASS_NAME } from "@/features/auth/account-constants";

type AccountSignInFormProps = {
  email: string;
  password: string;
  error: string | null;
  pending: boolean;
  passwordResetComplete: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function AccountSignInForm({
  email,
  password,
  error,
  pending,
  passwordResetComplete,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AccountSignInFormProps) {
  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className={AUTH_INPUT_CLASS_NAME}
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
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder={
            passwordResetComplete
              ? "Enter the new password you just created"
              : "Your password"
          }
          className={AUTH_INPUT_CLASS_NAME}
          key={passwordResetComplete ? "fresh-password" : "password"}
        />
        {passwordResetComplete ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Clear this field and type your new password manually. Do not rely on saved autofill.
          </p>
        ) : null}
      </div>

      {error ? (
        <p
          className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full" variant="premium">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
