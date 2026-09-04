import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isPrismaConnectionError } from "@/lib/db/connection-error";

/**
 * Reports database round-trip latency as measured from wherever the app runs.
 *
 * Latency to the database dominates page render time, so this is the number to
 * watch when changing DATABASE_URL (pooled vs direct endpoint, connection
 * limits, or region). `samples` runs several round trips and reports the median
 * so a single cold connection does not skew the result.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const samples = Math.min(10, Math.max(1, Number(searchParams.get("samples")) || 5));

  try {
    // Connect and warm the pool before timing anything.
    const connectStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const firstRoundTripMs = Math.round(performance.now() - connectStart);

    const timings: number[] = [];
    for (let i = 0; i < samples; i += 1) {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      timings.push(Math.round(performance.now() - start));
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return NextResponse.json(
      {
        ok: true,
        database: "connected",
        region: process.env.VERCEL_REGION ?? "local",
        pooled: /-pooler\./.test(process.env.DATABASE_URL ?? ""),
        firstRoundTripMs,
        medianRoundTripMs: median,
        minRoundTripMs: sorted[0],
        maxRoundTripMs: sorted[sorted.length - 1],
        samples: timings,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed.";
    return NextResponse.json(
      {
        ok: false,
        database: isPrismaConnectionError(error) ? "unreachable" : "error",
        region: process.env.VERCEL_REGION ?? "local",
        message,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
