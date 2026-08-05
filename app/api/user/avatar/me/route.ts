import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api/require-user";
import { prisma } from "@/lib/db/prisma";
import { parseDataUrl } from "@/lib/user/avatar";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { image: true, updatedAt: true },
  });

  if (!user?.image) {
    return new NextResponse(null, { status: 404 });
  }

  const parsed = parseDataUrl(user.image);
  if (!parsed) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(parsed.buffer, {
    headers: {
      "Content-Type": parsed.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Last-Modified": user.updatedAt.toUTCString(),
    },
  });
}
