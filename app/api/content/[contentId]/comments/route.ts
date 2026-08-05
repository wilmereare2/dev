import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { createComment, deleteComment, listComments } from "@/services/content/comments";
import { requireModeratorUser } from "@/lib/api/require-creator";

type Params = { params: Promise<{ contentId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { contentId } = await params;
  const comments = await listComments(contentId);
  return NextResponse.json({ comments });
}

const bodySchema = z.object({ body: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { contentId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }

  const comment = await createComment(auth.userId, contentId, parsed.data.body);
  return NextResponse.json(
    { comment, message: "Comment submitted for moderation." },
    { status: 201 },
  );
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireModeratorUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ commentId: z.string().min(1), approved: z.boolean() })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation data." }, { status: 400 });
  }

  const { moderateComment } = await import("@/services/content/comments");
  const comment = await moderateComment(parsed.data.commentId, parsed.data.approved);
  return NextResponse.json({ comment });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const commentId = new URL(request.url).searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Missing commentId." }, { status: 400 });

  const ok = await deleteComment(commentId, auth.userId);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
