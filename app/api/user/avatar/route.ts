import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/api/require-user";
import { withDbRetry } from "@/lib/db/connection-error";
import { mapPrismaErrorMessage } from "@/lib/db/prisma-error-message";
import { prisma } from "@/lib/db/prisma";
import { prepareAvatarDataUrl, validateAvatarUpload } from "@/lib/user/avatar";

export async function POST(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  try {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("avatar");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const valid = validateAvatarUpload(file);
    if (!valid.ok) {
      return NextResponse.json({ error: valid.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const prepared = prepareAvatarDataUrl(buffer, file.type || "image/jpeg");
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: 413 });
    }

    await withDbRetry(() =>
      prisma.user.update({
        where: { id: authResult.userId },
        data: { image: prepared.dataUrl },
      }),
    );

    const avatarVersion = Date.now();

    return NextResponse.json({ ok: true, image: prepared.dataUrl, avatarVersion });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Account not found. Sign out and sign in again to refresh your session." },
          { status: 404 },
        );
      }
    }

    console.error("[avatar upload]", error);
    return NextResponse.json(
      {
        error: mapPrismaErrorMessage(error, {
          fallback: "Could not save avatar. Try again in a moment.",
          connectionMessage: "Could not reach the database. Try again in a moment.",
          schemaMessage:
            "Profile photos are temporarily unavailable while the database is being updated. Try again shortly.",
        }),
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  try {
    await withDbRetry(() =>
      prisma.user.update({
        where: { id: authResult.userId },
        data: { image: null },
      }),
    );

    return NextResponse.json({ ok: true, image: null, avatarVersion: 0 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "Account not found. Sign out and sign in again to refresh your session." },
        { status: 404 },
      );
    }

    console.error("[avatar remove]", error);
    return NextResponse.json(
      {
        error: mapPrismaErrorMessage(error, {
          fallback: "Could not remove avatar.",
          connectionMessage: "Could not reach the database. Try again in a moment.",
        }),
      },
      { status: 500 },
    );
  }
}
