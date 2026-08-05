import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/api/require-user";
import { prisma } from "@/lib/db/prisma";
import { bufferToDataUrl, validateAvatarUpload } from "@/lib/user/avatar";

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
    const image = bufferToDataUrl(buffer, file.type);

    await prisma.user.update({
      where: { id: authResult.userId },
      data: { image },
    });

    const avatarVersion = Date.now();

    return NextResponse.json({ ok: true, image, avatarVersion });
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
      { error: "Could not save avatar. Check your connection and try again." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  try {
    await prisma.user.update({
      where: { id: authResult.userId },
      data: { image: null },
    });

    return NextResponse.json({ ok: true, image: null, avatarVersion: 0 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "Account not found. Sign out and sign in again to refresh your session." },
        { status: 404 },
      );
    }

    console.error("[avatar remove]", error);
    return NextResponse.json({ error: "Could not remove avatar." }, { status: 500 });
  }
}
