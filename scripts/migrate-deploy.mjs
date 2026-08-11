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
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    encoding: "utf8",
    env: process.env,
    shell: false,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function isTransientConnectionFailure(output) {
  return /P1001|Can't reach database server|Connection terminated|ECONNREFUSED|ETIMEDOUT|Connection reset/i.test(
    output,
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const retryDelaysMs = process.env.VERCEL === "1" ? [0, 8000, 15000] : [0];

let lastOutput = "";
let lastStatus = 1;

for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
  if (retryDelaysMs[attempt] > 0) {
    console.log(`[migrate] waiting ${retryDelaysMs[attempt] / 1000}s for database wake-up…`);
    await sleep(retryDelaysMs[attempt]);
  }

  const label = attempt === 0 ? "deploy" : `retry ${attempt}`;
  const result = runMigrate(label);
  lastOutput = result.output;
  lastStatus = result.status;

  if (result.status === 0) {
    process.exit(0);
  }

  if (!isTransientConnectionFailure(result.output)) {
    break;
  }
}

if (process.env.VERCEL === "1" && isTransientConnectionFailure(lastOutput)) {
  console.warn("[migrate] Neon/database unreachable during Vercel build (P1001).");
  console.warn("[migrate] Continuing build without applying migrations.");
  console.warn("[migrate] Wake Neon in the dashboard, then run: npx prisma migrate deploy");
  console.warn("[migrate] Ensure Vercel has both DATABASE_URL (pooler) and DIRECT_URL (unpooled).");
  process.exit(0);
}

process.exit(lastStatus);
