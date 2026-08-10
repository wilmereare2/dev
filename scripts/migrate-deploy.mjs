import { spawnSync } from "node:child_process";
import { ensurePrismaDatabaseEnv } from "./prepare-prisma-env.mjs";

const timeout = process.env.PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT ?? "60000";
process.env.PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT = timeout;

const envCheck = ensurePrismaDatabaseEnv();
if (!envCheck.ok) {
  console.warn("[migrate] Skipping prisma migrate deploy (DATABASE_URL unavailable at build time).");
  console.warn("[migrate] Enable DATABASE_URL for Vercel Build, or run: npx prisma migrate deploy");
  process.exit(0);
}

function runMigrate(label) {
  console.log(`[migrate] ${label}`);
  return spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
}

let result = runMigrate("deploy");

if (result.status !== 0 && process.env.VERCEL === "1") {
  console.log("[migrate] first attempt failed on Vercel, retrying in 5s…");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  result = runMigrate("retry");
}

process.exit(result.status ?? 1);
