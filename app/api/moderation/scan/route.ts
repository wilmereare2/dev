import { NextResponse } from "next/server";
import { z } from "zod";
import { scanContentForModeration } from "@/lib/moderation/ai-scan";

const bodySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  mediaType: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  mimeType: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid scan input." }, { status: 400 });
  }

  const result = scanContentForModeration(parsed.data);
  return NextResponse.json({ result });
}
