import { auth } from "@/lib/auth/auth";
import { resolveDbUserWithLocale } from "@/lib/auth/resolve-db-user";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/i18n/cookie";
import { isSupportedLocale, resolveLocale } from "@/lib/i18n/locales";

/**
 * Single entry point for the root layout. Resolves session, database user id,
 * and locale with one database query instead of the two sequential round trips
 * that previously ran ahead of every page render. Never throws.
 */
export async function resolveRootBootstrap() {
  const cookieStore = await cookies();
  const cookieLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  const { session } = await resolveRootSessionContextSafe();

  if (!session?.user) {
    return { session: null, userId: null as string | null, locale: cookieLocale };
  }

  try {
    const { userId, locale } = await resolveDbUserWithLocale({
      id: session.user.id,
      email: session.user.email,
    });
    return {
      session,
      userId,
      locale: isSupportedLocale(locale) ? locale : cookieLocale,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] resolveDbUserWithLocale failed in root layout:", error);
    }
    return { session, userId: null as string | null, locale: cookieLocale };
  }
}

/** Reads the session without throwing on transient auth failures. */
async function resolveRootSessionContextSafe() {
  try {
    return { session: await auth() };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] auth() failed in root layout:", error);
    }
    return { session: null };
  }
}
