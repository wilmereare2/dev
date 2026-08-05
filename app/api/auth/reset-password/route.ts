import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
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
    const result = await resetPasswordWithToken(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can sign in now.",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[reset-password]", error);
    }
    return NextResponse.json(
      { error: "Could not reset password. Try again in a moment." },
      { status: 500 },
    );
  }
}
