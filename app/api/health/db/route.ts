import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isPrismaConnectionError } from "@/lib/db/connection-error";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed.";
    return NextResponse.json(
      {
        ok: false,
        database: isPrismaConnectionError(error) ? "unreachable" : "error",
        message,
      },
      { status: 503 },
    );
  }
}
