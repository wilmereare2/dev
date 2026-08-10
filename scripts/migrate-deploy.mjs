import { spawnSync } from "node:child_process";

const timeout = process.env.PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT ?? "60000";

function buildEnv() {
  const env = {
    ...process.env,
    PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: timeout,
  };

  if (!env.DIRECT_URL && env.DATABASE_URL) {
    env.DIRECT_URL = env.DATABASE_URL;
    console.log("[migrate] DIRECT_URL not set; falling back to DATABASE_URL for migrations.");
  }

  return env;
}

function runMigrate(label) {
  console.log(`[migrate] ${label}`);
  return spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: buildEnv(),
    shell: true,
  });
}

let result = runMigrate("deploy");

if (result.status !== 0 && process.env.VERCEL === "1") {
  console.log("[migrate] first attempt failed on Vercel, retrying in 5s…");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  result = runMigrate("retry");
}

process.exit(result.status ?? 1);
