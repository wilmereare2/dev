"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usernameValidationMessage } from "@/lib/user/username";
import { COUNTRY_OPTIONS, GENDER_OPTIONS, RACE_OPTIONS } from "@/lib/user/profile-options";

export const registerInputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

export type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  race: string;
  hobbies: string;
  phone: string;
  telegram: string;
  whatsApp: string;
  zangi: string;
  wantsToCreate: boolean;
};

const STEP_LABELS = ["Account", "Public profile", "Private contact"] as const;
const TOTAL_STEPS = STEP_LABELS.length;

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

function FieldSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(registerInputClassName, !value && "text-muted-foreground")}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function StepProgress({ step }: { step: number }) {
  return (
    <div className="mt-5 space-y-2" aria-live="polite">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Step {step} of {TOTAL_STEPS}
      </p>
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === step;
          const complete = stepNumber < step;
          return (
            <span key={label} className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-2.5 rounded-full transition-colors",
                  active || complete ? "bg-accent" : "bg-border",
                )}
                aria-hidden
              />
              {index < STEP_LABELS.length - 1 ? (
                <span className="hidden h-px w-6 bg-border sm:inline-block" aria-hidden />
              ) : null}
            </span>
          );
        })}
      </div>
      <p className="text-sm text-foreground">{STEP_LABELS[step - 1]}</p>
    </div>
  );
}

function validateStep(step: number, values: RegisterFormValues): string | null {
  if (step === 1) {
    const usernameError = usernameValidationMessage(values.username);
    if (usernameError) return usernameError;
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      return "Enter a valid email address.";
    }
    if (values.password.length < 8) return "Password must be at least 8 characters.";
    if (values.password !== values.confirmPassword) return "Passwords do not match.";
    return null;
  }

  if (step === 2) {
    if (!values.name.trim()) return "Name is required.";
    if (!values.dateOfBirth) return "Date of birth is required.";
    if (!values.gender.trim()) return "Gender is required.";
    if (!values.country.trim()) return "Country is required.";
    if (!values.race.trim()) return "Race is required.";
    if (!values.hobbies.trim()) return "Hobbies are required.";
    return null;
  }

  if (step === 3) {
    const digits = values.phone.replace(/\D/g, "");
    if (values.phone.trim() && digits.length < 10) {
      return "Enter a valid phone number with country code.";
    }
    return null;
  }

  return null;
}

export function RegisterOnboarding({ values, onChange, onSubmit, pending, error }: RegisterOnboardingProps) {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  function goNext() {
    const message = validateStep(step, values);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 1));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = validateStep(step, values);
    if (message) {
      setStepError(message);
      return;
    }
    if (step < TOTAL_STEPS) {
      goNext();
      return;
    }
    setStepError(null);
    onSubmit();
  }

  const displayError = stepError ?? error;

  return (
    <form className="flex min-h-0 flex-col" onSubmit={handleSubmit} noValidate>
      <StepProgress step={step} />

      <div className="mt-5 min-h-0 flex-1 space-y-4">
        {step === 1 ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose your @username and sign-in credentials. Email stays private and is used only for verification.
            </p>
            <div>
              <FieldLabel htmlFor="register-username">Username</FieldLabel>
              <input
                id="register-username"
                name="username"
                autoComplete="username"
                value={values.username}
                onChange={(event) => onChange({ username: event.target.value.replace(/[^a-zA-Z0-9]/g, "") })}
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
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This information appears on your public profile so members can discover you on the platform.
            </p>
            <div>
              <FieldLabel htmlFor="register-name">Name</FieldLabel>
              <input
                id="register-name"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className={registerInputClassName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="register-dob">Date of birth</FieldLabel>
                <input
                  id="register-dob"
                  name="dateOfBirth"
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) => onChange({ dateOfBirth: event.target.value })}
                  className={registerInputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="register-gender">Gender</FieldLabel>
                <FieldSelect
                  id="register-gender"
                  name="gender"
                  value={values.gender}
                  onChange={(gender) => onChange({ gender })}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="register-country">Country</FieldLabel>
                <FieldSelect
                  id="register-country"
                  name="country"
                  value={values.country}
                  onChange={(country) => onChange({ country })}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select country"
                />
              </div>
              <div>
                <FieldLabel htmlFor="register-race">Race</FieldLabel>
                <FieldSelect
                  id="register-race"
                  name="race"
                  value={values.race}
                  onChange={(race) => onChange({ race })}
                  options={RACE_OPTIONS}
                  placeholder="Select race or ethnicity"
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="register-hobbies">Hobbies</FieldLabel>
              <textarea
                id="register-hobbies"
                name="hobbies"
                rows={2}
                value={values.hobbies}
                onChange={(event) => onChange({ hobbies: event.target.value })}
                className={cn(registerInputClassName, "h-auto min-h-[4.5rem] resize-none py-3")}
              />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Private contact details are never shown to other members. They are used for account security and recovery
              only — communicate on-site using your @username.
            </p>
            <div>
              <FieldLabel htmlFor="register-phone" hint="(optional)">
                Phone
              </FieldLabel>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
                placeholder="+1 555 123 4567"
                className={registerInputClassName}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional. If provided, you can verify by SMS after email confirmation.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="register-telegram" hint="(optional)">
                  Telegram
                </FieldLabel>
                <input
                  id="register-telegram"
                  name="telegram"
                  value={values.telegram}
                  onChange={(event) => onChange({ telegram: event.target.value })}
                  className={registerInputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="register-whatsapp" hint="(optional)">
                  WhatsApp
                </FieldLabel>
                <input
                  id="register-whatsapp"
                  name="whatsApp"
                  value={values.whatsApp}
                  onChange={(event) => onChange({ whatsApp: event.target.value })}
                  className={registerInputClassName}
                />
              </div>
              <div>
                <FieldLabel htmlFor="register-zangi" hint="(optional)">
                  Zangi
                </FieldLabel>
                <input
                  id="register-zangi"
                  name="zangi"
                  value={values.zangi}
                  onChange={(event) => onChange({ zangi: event.target.value })}
                  className={registerInputClassName}
                />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 px-3 py-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={values.wantsToCreate}
                onChange={(event) => onChange({ wantsToCreate: event.target.checked })}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>I want to upload content. Enables creator tools after verification.</span>
            </label>
          </>
        ) : null}
      </div>

      {displayError ? (
        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={pending || step === 1}
          onClick={goBack}
        >
          Back
        </Button>
        <Button type="submit" disabled={pending} className="w-full sm:min-w-[10rem] sm:w-auto">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Creating account…" : step === TOTAL_STEPS ? "Create account" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
