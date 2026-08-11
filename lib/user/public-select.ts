/** Fields safe to expose when returning another user's profile to non-admin callers. */
export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  gender: true,
  country: true,
  race: true,
  hobbies: true,
  image: true,
  role: true,
  settings: {
    select: {
      dateOfBirth: true,
    },
  },
} as const;

/** Lightweight identity for chat surfaces — never includes private contact fields. */
export const CHAT_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  image: true,
  role: true,
} as const;

export type PublicUserSummary = {
  id: string;
  username: string | null;
  name: string | null;
  gender: string | null;
  country: string | null;
  race: string | null;
  hobbies: string | null;
  image: string | null;
  role: string;
  settings?: { dateOfBirth: Date | null } | null;
};

/** Never include in cross-user API responses. */
export const PRIVATE_CONTACT_FIELDS = [
  "email",
  "phone",
  "telegram",
  "whatsApp",
  "zangi",
] as const;

export function computePublicAge(dateOfBirth: Date | null | undefined) {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function serializePublicUser(user: PublicUserSummary) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    gender: user.gender,
    country: user.country,
    race: user.race,
    hobbies: user.hobbies,
    image: user.image,
    role: user.role,
    age: computePublicAge(user.settings?.dateOfBirth),
  };
}

export function chatDisplayName(user: {
  username?: string | null;
  name?: string | null;
}) {
  if (user.username) return `@${user.username}`;
  return user.name?.trim() || "Member";
}
