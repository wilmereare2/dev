import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmailForUser } from "@/lib/auth/password-reset";

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
    const result = await sendPasswordResetEmailForUser(parsed.data.email, appUrl);

    return NextResponse.json({
      ok: true,
      emailSent: Boolean(result.sent && !result.resetUrl),
      message: result.resetUrl
        ? "Email delivery is not configured on this server. No message was sent to your inbox."
        : "If an account exists for that email, we sent password reset instructions. Check your inbox and spam folder.",
      resetUrl: result.resetUrl,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[forgot-password]", error);
    }
    return NextResponse.json(
      { error: "Could not send reset email. Try again in a moment." },
      { status: 500 },
    );
  }
}
