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

function validateDateParts(year: number, month: number, day: number): DateValidationResult {
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { ok: false, error: "Date of birth cannot be in the future." };
  }

  return { ok: true, date };
}

/** Parse YYYY-MM-DD from an HTML date input and validate it. */
export function parseDateOfBirth(value: string): DateValidationResult {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid date of birth." };
  }

  const [yearStr, monthStr, dayStr] = trimmed.split("-");
  return validateDateParts(Number(yearStr), Number(monthStr), Number(dayStr));
}

/** Parse MM / DD / YYYY display input (also accepts ISO paste). */
export function parseDisplayDateOfBirth(value: string): DateValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter your date of birth." };
  }

  const usMatch = trimmed.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (usMatch) {
    return validateDateParts(Number(usMatch[3]), Number(usMatch[1]), Number(usMatch[2]));
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split("-");
    return validateDateParts(Number(yearStr), Number(monthStr), Number(dayStr));
  }

  if (/^\d{8}$/.test(trimmed.replace(/\D/g, ""))) {
    const digits = trimmed.replace(/\D/g, "");
    return validateDateParts(
      Number(digits.slice(4, 8)),
      Number(digits.slice(0, 2)),
      Number(digits.slice(2, 4)),
    );
  }

  return { ok: false, error: "Use MM / DD / YYYY." };
}

export function formatDateOfBirthInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
}

export function toIsoDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateAgeVerificationInput(input: {
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}): DateValidationResult | { ok: false; error: string } {
  if (!input.acceptTerms || !input.acceptPrivacy) {
    return { ok: false, error: "You must accept the Terms of Service and Privacy Policy." };
  }

  const parsed = parseDisplayDateOfBirth(input.dateOfBirth);
  if (!parsed.ok) return parsed;

  if (!isAdult(parsed.date)) {
    return { ok: false, error: "You must be at least 18 years old to use manuelaX." };
  }

  return parsed;
}
