export function isPrismaConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return (
    message.includes("Can't reach database server") ||
    message.includes("P1001") ||
    message.includes("Connection terminated") ||
    message.includes("Connection reset") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("Connection closed")
  );
}

export function databaseUnavailableMessage() {
  return "The database is temporarily unavailable. Wake your Neon project, confirm DATABASE_URL on Vercel, then try again.";
}

export function publicDatabaseHealthMessage(database: "connected" | "unreachable" | "error", detail?: string) {
  if (database === "connected") return undefined;

  if (database === "unreachable") {
    return "Database is unreachable. In Neon, open your project and confirm it is active (not suspended). In Vercel, verify DATABASE_URL uses the Neon pooler URL with ?sslmode=require.";
  }

  if (detail && detail.includes("schema is out of date")) {
    return detail;
  }

  return "Database check failed. Confirm Neon is running and production env vars are set.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry transient Neon wake-up / pooler connection failures (common on cold start). */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMs?: number } = {},
) {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 2000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const canRetry = isPrismaConnectionError(error) && attempt < attempts;
      if (!canRetry) break;
      await sleep(delayMs);
    }
  }

  throw lastError;
}

