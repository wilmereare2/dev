/** Fields safe to expose when returning another user's profile to non-admin callers. */
export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  image: true,
  role: true,
} as const;

export type PublicUserSummary = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
};
