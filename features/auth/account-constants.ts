import type { RegisterFormValues } from "@/features/auth/register-onboarding";

export const AUTH_INPUT_CLASS_NAME =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

export const EMPTY_REGISTER_VALUES: RegisterFormValues = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  wantsToCreate: false,
};

export type AuthMode = "signin" | "register";
