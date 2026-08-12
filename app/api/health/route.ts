import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  isPrismaConnectionError,
  publicDatabaseHealthMessage,
  withDbRetry,
} from "@/lib/db/connection-error";
import { isSchemaDriftError } from "@/lib/db/prisma-error-message";

async function checkDatabase() {
  await withDbRetry(async () => {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.user.findFirst({
      select: {
        username: true,
        phone: true,
        gender: true,
        country: true,
        race: true,
        hobbies: true,
      },
    });
  });
}

export async function GET() {
  let database: "connected" | "unreachable" | "error" = "connected";
  let databaseMessage: string | undefined;
  let detail: string | undefined;

  try {
    await checkDatabase();
  } catch (error) {
    database = isPrismaConnectionError(error) ? "unreachable" : "error";
    detail = error instanceof Error ? error.message : "Database check failed.";

    if (isSchemaDriftError(error)) {
      detail = "Database schema is out of date. Run npx prisma migrate deploy against production Neon.";
    }

    databaseMessage = publicDatabaseHealthMessage(database, detail);
  }

  const ok = database === "connected";

  return NextResponse.json(
    {
      ok,
      database,
      databaseMessage,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    },
    { status: ok ? 200 : 503 },
  );
}
