import { Prisma } from "@prisma/client";
import { isPrismaConnectionError } from "@/lib/db/connection-error";

type MapPrismaErrorOptions = {
  fallback?: string;
  schemaMessage?: string;
  connectionMessage?: string;
};

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";
const DEFAULT_SCHEMA_MESSAGE =
  "Registration is temporarily unavailable while the site database is being updated. Please try again in a few minutes.";
const DEFAULT_CONNECTION_MESSAGE = "Could not reach the database. Try again in a moment.";

export function mapPrismaErrorMessage(error: unknown, options: MapPrismaErrorOptions = {}) {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;
  const schemaMessage = options.schemaMessage ?? DEFAULT_SCHEMA_MESSAGE;
  const connectionMessage = options.connectionMessage ?? DEFAULT_CONNECTION_MESSAGE;

  if (isPrismaConnectionError(error)) {
    return connectionMessage;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return connectionMessage;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [];

      if (fields.includes("username")) return "That username is already taken.";
      if (fields.includes("email")) return "This email is already registered. Sign in to continue.";
      if (fields.includes("phone")) return "That phone number is already linked to another account.";

      return "An account with these details already exists.";
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return schemaMessage;
    }
  }

  return fallback;
}

export function isSchemaDriftError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}
