/**
 * Ensures Prisma datasource env vars exist before generate/migrate.
 * On Vercel, DATABASE_URL must be enabled for the Build environment.
 */
import { pathToFileURL } from "node:url";

export function ensurePrismaDatabaseEnv() {
  if (!process.env.DATABASE_URL) {
    return { ok: false, reason: "missing_database_url" };
  }

  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
    console.log("[prisma-env] DIRECT_URL not set; using DATABASE_URL.");
  }

  return { ok: true };
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const result = ensurePrismaDatabaseEnv();
  if (!result.ok) {
    console.warn("[prisma-env] DATABASE_URL not set. Prisma migrate will be skipped on this build.");
    console.warn("[prisma-env] In Vercel, add DATABASE_URL and DIRECT_URL and enable them for Build.");
  }
}
