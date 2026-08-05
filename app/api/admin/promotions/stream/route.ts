import { requireApiRole } from "@/lib/auth/api-guards";
import { listPromotionsUpdatedSince, mapAdminPromotion } from "@/services/admin/promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  let since = sinceRaw ? new Date(sinceRaw) : new Date(Date.now() - 60_000);
  if (Number.isNaN(since.getTime())) since = new Date(Date.now() - 60_000);

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  void (async () => {
    const deadline = Date.now() + 55_000;

    try {
      while (Date.now() < deadline) {
        if (request.signal.aborted) break;

        const items = await listPromotionsUpdatedSince(since);
        for (const item of items) {
          since = item.updatedAt;
          await writer.write(encoder.encode(`data: ${JSON.stringify(mapAdminPromotion(item))}\n\n`));
        }

        await writer.write(encoder.encode(": keepalive\n\n"));
        await sleep(2000);
      }
    } catch {
      /* client disconnected */
    } finally {
      try {
        await writer.close();
      } catch {
        /* ignore */
      }
    }
  })();

  request.signal.addEventListener("abort", () => {
    void writer.close().catch(() => undefined);
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
