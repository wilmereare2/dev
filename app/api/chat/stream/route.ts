import { requireApiUser } from "@/lib/api/require-user";
import { listChatMessagesSince } from "@/services/chat/member-chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const authResult = await requireApiUser();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  let after = searchParams.get("after");

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  void (async () => {
    const deadline = Date.now() + 55_000;

    try {
      while (Date.now() < deadline) {
        if (request.signal.aborted) break;

        const messages = await listChatMessagesSince(after);
        for (const message of messages) {
          after = message.id;
          await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        }

        await writer.write(encoder.encode(": keepalive\n\n"));
        await sleep(1500);
      }
    } catch {
      /* client disconnected or stream closed */
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
