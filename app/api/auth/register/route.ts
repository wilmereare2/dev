import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register-user";
import { registerProfileSchema } from "@/lib/user/register-schema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerProfileSchema.safeParse(body);
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
        { status: result.code === "ALREADY_REGISTERED" ? 409 : 400 },
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
      username: result.username,
      devAutoVerified: result.devAutoVerified,
      verifyUrl: result.verifyUrl,
      emailSent: result.emailSent,
      deliveryError,
      resumed: "resumed" in result && result.resumed,
      message: result.devAutoVerified
        ? "Account created. You can sign in now."
        : result.emailSent
          ? "Check your email for a verification code. Phone verification is required before messaging."
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
