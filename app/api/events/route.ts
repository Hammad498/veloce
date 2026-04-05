import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = Math.random().toString(36).slice(2);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client = { id: clientId, controller };
      addSSEClient(client);

      controller.enqueue(encoder.encode(`event: ping\ndata: connected\n\n`));

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          removeSSEClient(client);
        }
      }, 30_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSSEClient(client);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
