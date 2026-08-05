import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";

export async function requireApiUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = await resolveDbUserId({
    id: session.user.id,
    email: session.user.email,
  });

  if (!userId) {
    return {
      error: NextResponse.json(
        { error: "Account not found. Sign out and sign in again to refresh your session." },
        { status: 404 },
      ),
    };
  }

  return { userId, session };
}
