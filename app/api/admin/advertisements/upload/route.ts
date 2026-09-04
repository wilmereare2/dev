import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { MAX_AD_IMAGE_BYTES, storeAdImageFile } from "@/lib/ads/media";

export async function POST(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Upload could not be read. The file may be too large." },
      { status: 400 },
    );
  }

  const file = formData.get("image");
  const variant = formData.get("variant");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > MAX_AD_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 413 });
  }

  try {
    const result = await storeAdImageFile(file, authResult.userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      url: result.url,
      variant: typeof variant === "string" ? variant : "default",
    });
  } catch (error) {
    console.error("[ads/upload] failed to store creative", error);
    return NextResponse.json({ error: "Could not store the image. Try again." }, { status: 500 });
  }
}
