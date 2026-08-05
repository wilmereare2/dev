import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { onboardAsCreator } from "@/services/creator/onboard";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  const result = await onboardAsCreator(
    auth.userId,
    parsed.success ? parsed.data.displayName : undefined,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    role: result.role,
    autoApproved: result.autoApproved,
    profile: result.profile,
    message: result.autoApproved
      ? "Creator tools enabled. You can upload now."
      : "Creator profile created. Upload drafts now; publishing unlocks after review.",
    next: "/create/upload",
  });
}

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { getCreatorAccessState } = await import("@/lib/auth/creator-access");
  const state = await getCreatorAccessState(auth.userId);
  return NextResponse.json(state);
}
