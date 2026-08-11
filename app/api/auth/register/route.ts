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

    const deliveryError =
      "deliveryError" in result ? result.deliveryError : undefined;

    return NextResponse.json({
      ok: true,
      email: result.email,
      devAutoVerified: result.devAutoVerified,
      verifyUrl: result.verifyUrl,
      emailSent: result.emailSent,
      deliveryError,
      resumed: "resumed" in result && result.resumed,
      message: result.devAutoVerified
        ? "Account created. You can sign in now."
        : result.emailSent
          ? "Check your email for a 6-digit verification code before signing in."
          : deliveryError ??
            "Account created, but the verification email could not be delivered yet.",
    });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { error: "Could not create account. Try again in a moment." },
      { status: 500 },
    );
  }
}
