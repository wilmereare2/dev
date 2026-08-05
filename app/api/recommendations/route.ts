import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getPersonalizedRecommendations } from "@/services/recommendations/ai";

export async function GET() {
  const session = await auth();
  const items = await getPersonalizedRecommendations(session?.user?.id, 8);
  return NextResponse.json({ items });
}
