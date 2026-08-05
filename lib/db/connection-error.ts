export function isPrismaConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("Connection reset") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("Connection closed")
  );
}

export function databaseUnavailableMessage() {
  return "The database is temporarily unavailable. Check your Neon project is active and DATABASE_URL in .env is correct, then refresh.";
}
