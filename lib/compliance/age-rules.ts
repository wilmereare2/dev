export const MIN_AGE_YEARS = 18;

export type DateValidationResult =
  | { ok: true; date: Date }
  | { ok: false; error: string };

export function calculateAge(dateOfBirth: Date, today = new Date()) {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAdult(dateOfBirth: Date, today = new Date()) {
  return calculateAge(dateOfBirth, today) >= MIN_AGE_YEARS;
}

/** Parse YYYY-MM-DD from an HTML date input and validate it. */
export function parseDateOfBirth(value: string): DateValidationResult {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const [yearStr, monthStr, dayStr] = trimmed.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { ok: false, error: "Date of birth cannot be in the future." };
  }

  return { ok: true, date };
}

export function validateAgeVerificationInput(input: {
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}): DateValidationResult | { ok: false; error: string } {
  if (!input.acceptTerms || !input.acceptPrivacy) {
    return { ok: false, error: "You must accept the Terms of Service and Privacy Policy." };
  }

  const parsed = parseDateOfBirth(input.dateOfBirth);
  if (!parsed.ok) return parsed;

  if (!isAdult(parsed.date)) {
    return { ok: false, error: "You must be at least 18 years old to use manuelaX." };
  }

  return parsed;
}
