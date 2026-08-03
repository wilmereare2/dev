import type { Role } from "@/types";

const ROLES: readonly Role[] = ["ADMIN", "EDITOR", "MODERATOR", "VIEWER", "USER"];

export function parseRole(value: unknown): Role | undefined {
  if (typeof value !== "string") return undefined;
  return ROLES.includes(value as Role) ? (value as Role) : undefined;
}
