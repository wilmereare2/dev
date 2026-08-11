import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isPrismaConnectionError } from "@/lib/db/connection-error";

export async function GET() {
  let database: "connected" | "unreachable" | "error" = "connected";
  let databaseMessage: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = isPrismaConnectionError(error) ? "unreachable" : "error";
    databaseMessage = error instanceof Error ? error.message : "Database check failed.";
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
