import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`verification-status:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ exists: false, verified: false });
    }

    return NextResponse.json({
      exists: true,
      verified: Boolean(user.emailVerified),
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[verification-status]", error);
    }
    return NextResponse.json(
      { error: "Could not check account status. Try again in a moment." },
      { status: 503 },
    );
  }
}
