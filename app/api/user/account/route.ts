import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/api/require-user";
import { deleteUserAccount, exportUserData } from "@/services/user/security";

export async function GET() {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const data = await exportUserData(authResult.userId);
  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="manuelax-export-${authResult.userId}.json"`,
    },
  });
}

const deleteSchema = z.object({ password: z.string().optional() });

export async function DELETE(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const body = await request.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
  }

  const result = await deleteUserAccount(authResult.userId, parsed.data.password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
