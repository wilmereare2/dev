import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { serializePublicUser } from "@/lib/user/public-select";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const normalized = username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      username: true,
      name: true,
      gender: true,
      country: true,
      race: true,
      hobbies: true,
      image: true,
      role: true,
      settings: { select: { dateOfBirth: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  return NextResponse.json({ profile: serializePublicUser(user) });
}
