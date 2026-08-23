import { z } from "zod";
import { isValidUsername, normalizeUsername } from "@/lib/user/username";
import { parseDateOfBirth } from "@/lib/compliance/age-rules";
import { COUNTRY_SET, GENDER_SET, RACE_SET } from "@/lib/user/profile-options";
import { normalizePhoneNumber } from "@/lib/auth/verification-codes";

export const registerProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .transform(normalizeUsername)
    .refine(isValidUsername, "Username can only use letters and numbers (3–20 characters)."),
  name: z.string().trim().min(1, "Name is required.").max(120),
  dateOfBirth: z
    .string()
    .trim()
    .refine((value) => parseDateOfBirth(value).ok, "Enter a valid date of birth."),
  gender: z
    .string()
    .trim()
    .min(1, "Gender is required.")
    .refine((value) => GENDER_SET.has(value), "Select a valid gender."),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .refine((value) => COUNTRY_SET.has(value), "Select a valid country."),
  race: z
    .string()
    .trim()
    .min(1, "Race is required.")
    .refine((value) => RACE_SET.has(value), "Select a valid race or ethnicity."),
  hobbies: z.string().trim().min(1, "Hobbies are required.").max(500),
  email: z.string().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? "")
    .refine(
      (value) => value === "" || normalizePhoneNumber(value) !== null,
      "Enter a valid phone number with country code.",
    ),
  password: z.string().min(8, "Password must be at least 8 characters."),
  telegram: z.string().trim().max(80).optional().or(z.literal("")),
  whatsApp: z.string().trim().max(80).optional().or(z.literal("")),
  zangi: z.string().trim().max(80).optional().or(z.literal("")),
  wantsToCreate: z.boolean().optional(),
});

export type RegisterProfileInput = z.infer<typeof registerProfileSchema>;
