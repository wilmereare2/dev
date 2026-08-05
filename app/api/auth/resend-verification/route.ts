import { NextResponse } from "next/server";
import { z } from "zod";
import { sendVerificationEmailForUser } from "@/lib/auth/verification";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function POST(request: Request) {
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

  try {
    const appUrl = new URL(request.url).origin;
    const result = await sendVerificationEmailForUser(parsed.data.email, appUrl);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Verification email sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not send verification email. Try again in a moment." },
      { status: 500 },
    );
  }
}
