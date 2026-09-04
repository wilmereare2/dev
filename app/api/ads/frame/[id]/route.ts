import { prisma } from "@/lib/db/prisma";
import { isAdEligibleForServe } from "@/lib/ads/validation";
import { AD_PLACEMENTS, isAdPlacement } from "@/lib/ads/placements";

type Params = { params: Promise<{ id: string }> };

/**
 * Renders a third-party ad tag inside its own document.
 *
 * The page that shows the ad embeds this route in a sandboxed iframe, so the
 * network's script executes here — isolated from the site's DOM, cookies and
 * storage, and unable to block the parent's main thread.
 *
 * `sandbox` is applied on the parent <iframe>, not here; this response only
 * needs to stay un-framed by third parties and uncached.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const ad = await prisma.advertisement.findUnique({
    where: { id },
    select: {
      creativeType: true,
      embedCode: true,
      iframeUrl: true,
      placement: true,
      status: true,
      startAt: true,
      endAt: true,
      archivedAt: true,
    },
  });

  if (
    !ad ||
    !isAdEligibleForServe({
      status: ad.status,
      startAt: ad.startAt,
      endAt: ad.endAt,
      archivedAt: ad.archivedAt,
    })
  ) {
    return new Response("Not found", { status: 404 });
  }

  const size = isAdPlacement(ad.placement)
    ? AD_PLACEMENTS[ad.placement]
    : { width: 300, height: 250 };

  // An iframe-type creative is nested rather than inlined, so a network URL
  // that itself sets X-Frame-Options still renders in its own context.
  const inner =
    ad.creativeType === "iframe" && ad.iframeUrl
      ? `<iframe src="${escapeAttribute(ad.iframeUrl)}" width="${size.width}" height="${size.height}" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`
      : (ad.embedCode ?? "");

  if (!inner.trim()) {
    return new Response("Not found", { status: 404 });
  }

  const body = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;padding:0;background:transparent;overflow:hidden}
body{display:flex;align-items:center;justify-content:center;
width:100%;height:100vh;font:12px system-ui,sans-serif;color:#888}
img,iframe,ins,video{max-width:100%;border:0;display:block}
</style></head><body>${inner}</body></html>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Ads rotate per request, so this document is never cached.
      "Cache-Control": "no-store, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
