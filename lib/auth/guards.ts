import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import type { Role } from "@/types";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/account");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const role = session.user.role ?? "USER";
  if (!roles.includes(role)) redirect("/");
  return session;
}

export async function getOptionalSession() {
  return auth();
}
