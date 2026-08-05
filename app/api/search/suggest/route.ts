import { NextResponse } from "next/server";
import { fetchSearchSuggestions } from "@/services/search/suggestions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const suggestions = await fetchSearchSuggestions(q);
  return NextResponse.json({ suggestions });
}
