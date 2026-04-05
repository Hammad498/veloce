// Server-Sent Events broadcaster - module-level registry for single-instance deployments
// For multi-instance: replace with Upstash Pub/Sub or Redis pub/sub

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Set<SSEClient>();

export function addSSEClient(client: SSEClient) {
  clients.add(client);
}

export function removeSSEClient(client: SSEClient) {
  clients.delete(client);
}

export function broadcastSSE(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  for (const client of clients) {
    try {
      client.controller.enqueue(encoder.encode(message));
    } catch {
      clients.delete(client);
    }
  }
}
