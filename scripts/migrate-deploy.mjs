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

function runPrisma(args, label) {
  console.log(`[migrate] ${label}`);
  const result = spawnSync("npx", ["prisma", ...args], {
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

function runMigrate(label) {
  return runPrisma(["migrate", "deploy"], label);
}

function isTransientConnectionFailure(output) {
  return /P1001|Can't reach database server|Connection terminated|ECONNREFUSED|ETIMEDOUT|Connection reset/i.test(
    output,
  );
}

function extractFailedMigrationName(output) {
  const started = output.match(/The `([^`]+)` migration started at/i);
  if (started?.[1]) return started[1];
  const named = output.match(/Migration name:\s*(\S+)/i);
  return named?.[1] ?? null;
}

function isMigrationBlocked(output) {
  return /P3009|P3018|failed migrations in the target database|A migration failed to apply/i.test(output);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const retryDelaysMs = process.env.VERCEL === "1" ? [0, 8000, 15000] : [0];
const maxResolveAttempts = 3;

let lastOutput = "";
let lastStatus = 1;

for (let attempt = 0; attempt < retryDelaysMs.length; attempt += 1) {
  if (retryDelaysMs[attempt] > 0) {
    console.log(`[migrate] waiting ${retryDelaysMs[attempt] / 1000}s for database wake-up…`);
    await sleep(retryDelaysMs[attempt]);
  }

  for (let resolveAttempt = 0; resolveAttempt < maxResolveAttempts; resolveAttempt += 1) {
    const deployLabel =
      attempt === 0 && resolveAttempt === 0
        ? "deploy"
        : `deploy (attempt ${attempt + 1}, resolve ${resolveAttempt + 1})`;
    const result = runMigrate(deployLabel);
    lastOutput = result.output;
    lastStatus = result.status;

    if (result.status === 0) {
      process.exit(0);
    }

    if (!isMigrationBlocked(result.output)) {
      break;
    }

    const migrationName = extractFailedMigrationName(result.output);
    if (!migrationName || resolveAttempt >= maxResolveAttempts - 1) {
      break;
    }

    console.warn(`[migrate] migration blocked (${migrationName}); marking rolled back and retrying…`);
    const resolveResult = runPrisma(
      ["migrate", "resolve", "--rolled-back", migrationName],
      `resolve rolled-back ${migrationName}`,
    );
    if (resolveResult.status !== 0) {
      lastOutput = resolveResult.output;
      lastStatus = resolveResult.status;
      break;
    }
  }

  if (lastStatus === 0) {
    process.exit(0);
  }

  if (!isTransientConnectionFailure(lastOutput)) {
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
