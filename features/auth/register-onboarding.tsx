"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_INPUT_CLASS_NAME } from "@/features/auth/account-constants";
import { usernameValidationMessage } from "@/lib/user/username";

export const registerInputClassName = AUTH_INPUT_CLASS_NAME;

/**
 * Sign-up is a single step.
 *
 * Age eligibility is already established by the age gate before any page
 * renders, so all an account needs is a username, an email and a password.
 * Profile details (name, location, contact handles) are optional and collected
 * later from settings instead of blocking registration.
 */
export type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  wantsToCreate: boolean;
};

type RegisterOnboardingProps = {
  values: RegisterFormValues;
  onChange: (patch: Partial<RegisterFormValues>) => void;
  onSubmit: () => void;
  pending: boolean;
  error: string | null;
};

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
      {hint ? <span className="font-normal text-muted-foreground"> {hint}</span> : null}
    </label>
  );
}

function validate(values: RegisterFormValues): string | null {
  const usernameError = usernameValidationMessage(values.username);
  if (usernameError) return usernameError;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return "Enter a valid email address.";
  }
  if (values.password.length < 8) return "Password must be at least 8 characters.";
  if (values.password !== values.confirmPassword) return "Passwords do not match.";

  return null;
}

export function RegisterOnboarding({
  values,
  onChange,
  onSubmit,
  pending,
  error,
}: RegisterOnboardingProps) {
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = validate(values);
    if (message) {
      setFormError(message);
      return;
    }
    setFormError(null);
    onSubmit();
  }

  const displayError = formError ?? error;

  return (
    <form className="flex min-h-0 flex-col" onSubmit={handleSubmit} noValidate>
      <div className="mt-5 min-h-0 flex-1 space-y-4">
        <div>
          <FieldLabel htmlFor="register-username">Username</FieldLabel>
          <input
            id="register-username"
            name="username"
            autoComplete="username"
            value={values.username}
            onChange={(event) =>
              onChange({ username: event.target.value.replace(/[^a-zA-Z0-9]/g, "") })
            }
            placeholder="jamesmartin"
            className={registerInputClassName}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Letters and numbers only. Other members find you by @username in chat.
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="register-email" hint="(private)">
            Email
          </FieldLabel>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="you@example.com"
            className={registerInputClassName}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Kept private. You can start browsing right away — verifying it later turns on
            notifications and member-promoted posts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="register-password">Password</FieldLabel>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => onChange({ password: event.target.value })}
              placeholder="At least 8 characters"
              className={registerInputClassName}
            />
          </div>
          <div>
            <FieldLabel htmlFor="register-confirm-password">Confirm password</FieldLabel>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => onChange({ confirmPassword: event.target.value })}
              placeholder="Repeat password"
              className={registerInputClassName}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-3">
          <input
            type="checkbox"
            checked={values.wantsToCreate}
            onChange={(event) => onChange({ wantsToCreate: event.target.checked })}
            className="mt-0.5 size-4 accent-accent"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">I want to publish content</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Enables creator tools. You can also turn this on later from your account.
            </span>
          </span>
        </label>
      </div>

      {displayError ? (
        <p
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {displayError}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" variant="premium" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Create account"}
        </Button>
      </div>
    </form>
  );
}
