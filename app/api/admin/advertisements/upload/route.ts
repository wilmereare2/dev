import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { adImageFileToDataUrl } from "@/lib/ads/media";

export async function POST(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  const variant = formData?.get("variant");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  const result = await adImageFileToDataUrl(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    url: result.url,
    variant: typeof variant === "string" ? variant : "default",
  });
}
