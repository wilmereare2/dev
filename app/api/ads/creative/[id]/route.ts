import { NextResponse } from "next/server";
import { getAdCreative } from "@/lib/ads/media";

type Params = { params: Promise<{ id: string }> };

/**
 * Serves a stored ad banner. Creative bytes are immutable once written — a new
 * upload always gets a new id — so this can be cached aggressively.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const creative = await getAdCreative(id);
  if (!creative) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = `"${creative.checksum}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const body = new Uint8Array(creative.data);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": creative.mimeType,
      "Content-Length": String(creative.byteSize),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
