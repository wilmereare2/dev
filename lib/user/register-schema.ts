import { z } from "zod";
import { isValidUsername, normalizeUsername } from "@/lib/user/username";
import { parseDateOfBirth } from "@/lib/compliance/age-rules";
import { COUNTRY_SET, GENDER_SET, RACE_SET } from "@/lib/user/profile-options";
import { normalizePhoneNumber } from "@/lib/auth/verification-codes";

/** Optional free-text field: "" and undefined both mean "not provided". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.trim() || undefined);

/** Optional value from a fixed option list. */
const optionalChoice = (set: Set<string>, message: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.trim() || undefined)
    .refine((value) => value === undefined || set.has(value), message);

/**
 * Sign-up input.
 *
 * Only a username, email and password are required. Age is established by the
 * age gate before any page renders, and the profile details below are collected
 * later from settings rather than blocking account creation.
 */
export const registerProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .refine(isValidUsername, "Username can only use letters and numbers (3–20 characters)."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),

  // --- Everything below is optional and may be filled in later. ---
  name: optionalText(120),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.trim() || undefined)
    .refine(
      (value) => value === undefined || parseDateOfBirth(value).ok,
      "Enter a valid date of birth.",
    ),
  gender: optionalChoice(GENDER_SET, "Select a valid gender."),
  country: optionalChoice(COUNTRY_SET, "Select a valid country."),
  race: optionalChoice(RACE_SET, "Select a valid race or ethnicity."),
  hobbies: optionalText(500),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.trim() || "")
    .refine(
      (value) => value === "" || normalizePhoneNumber(value) !== null,
      "Enter a valid phone number with country code.",
    ),
  telegram: optionalText(80),
  whatsApp: optionalText(80),
  zangi: optionalText(80),
  wantsToCreate: z.boolean().optional(),
});

export type RegisterProfileInput = z.infer<typeof registerProfileSchema>;
