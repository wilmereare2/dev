import { auth } from "@/lib/auth/auth";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";

/** Root layout bootstrap — never throw on transient DB/auth failures. */
export async function resolveRootSessionContext() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { session: null, userId: null as string | null };
    }

    try {
      const userId = await resolveDbUserId({
        id: session.user.id,
        email: session.user.email,
      });
      return { session, userId };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth] resolveDbUserId failed in root layout:", error);
      }
      return { session, userId: null as string | null };
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] auth() failed in root layout:", error);
    }
    return { session: null, userId: null as string | null };
  }
}
