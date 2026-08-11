import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth/register-user";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(1).max(120).optional(),
  wantsToCreate: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const appUrl = new URL(request.url).origin;
    const result = await registerUser(parsed.data, appUrl);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 409 },
      );
    }

    if (parsed.data.wantsToCreate && result.userId) {
      const { onboardAsCreator } = await import("@/services/creator/onboard");
      await onboardAsCreator(result.userId, parsed.data.name).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      email: result.email,
      devAutoVerified: result.devAutoVerified,
      verifyUrl: result.verifyUrl,
      emailSent: result.emailSent,
      resumed: "resumed" in result && result.resumed,
      message: result.devAutoVerified
        ? "Account created. You can sign in now."
        : "resumed" in result && result.resumed
          ? result.emailSent
            ? "We sent a fresh verification link to your email. Open it to finish setup."
            : "Your account is waiting for verification. Use the link below to finish setup."
          : result.emailSent
            ? "Check your email for a verification link before signing in."
            : "Account created. Use the verification link below to activate your account.",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[register]", error);
    }
    return NextResponse.json(
      { error: "Could not create account. Try again in a moment." },
      { status: 500 },
    );
  }
}
