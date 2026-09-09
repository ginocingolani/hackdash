import { activityBus } from "@hackdash/db";
import { api, CORS_HEADERS } from "@/lib/api";

export const dynamic = "force-dynamic";

// Per-dashboard activity feed over SSE — replaces the legacy socket.io 0.9
// rooms. Payloads come from the activity bus, which already strips emails
// (legacy bug #10).
export const GET = api<{ params: Promise<{ domain: string }> }>(async (request, { params }) => {
  const { domain } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      send(`retry: 5000\n\n`);
      const unsubscribe = activityBus.onActivity((event) => {
        if (event.domain === domain) {
          send(`event: post\ndata: ${JSON.stringify(event)}\n\n`);
        }
      });
      const heartbeat = setInterval(() => send(`: ping\n\n`), 30_000);
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});
