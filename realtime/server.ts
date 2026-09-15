// Reusable realtime gateway (Bun native WebSocket, two-way).
// Run with `bun run realtime` (default port 3001).
//
// Browser clients connect to /ws (cookie auth), then multiplex topics over
// one socket: subscribe/unsubscribe/publish/ping. Next.js routes fan out
// server-side events through POST /publish. See docs/realtime.md to add a
// topic or a publish handler for a new feature.

import { authenticate } from "@/lib/auth/auth.service";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import {
  canPublish,
  canSubscribe,
  encodeServerMessage,
  isValidTopic,
  parseClientMessage,
  type RealtimeUser,
  resolvePublishSecret,
} from "@/lib/realtime/protocol";

const MAX_PAYLOAD_BYTES = 64 * 1024;

export type PublishContext = {
  user: RealtimeUser;
  topic: string;
  payload: unknown;
  publish: (topic: string, payload: unknown, from?: string) => void;
};

export type PublishHandler = (ctx: PublishContext) => Promise<void> | void;

type HandlerEntry = { prefix: string; handler: PublishHandler };

const handlers: HandlerEntry[] = [];

// Register server-side logic for client publishes on topics starting with
// prefix (e.g. persist a chat message before rebroadcast). The default when
// no handler matches is a plain rebroadcast to the topic.
export function registerPublishHandler(
  prefix: string,
  handler: PublishHandler,
): () => void {
  const entry = { prefix, handler };
  handlers.push(entry);
  return () => {
    const index = handlers.indexOf(entry);
    if (index >= 0) handlers.splice(index, 1);
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

async function userFromToken(
  token: string | null,
): Promise<RealtimeUser | null> {
  if (!token) return null;
  try {
    const user = await authenticate(token);
    return user ? { id: user.id, role: user.role } : null;
  } catch {
    return null;
  }
}

function payloadTooLarge(payload: unknown): boolean {
  try {
    return JSON.stringify(payload)?.length > MAX_PAYLOAD_BYTES;
  } catch {
    return true;
  }
}

export type RealtimeServerOptions = {
  port?: number;
  publishSecret?: string;
};

export function startRealtimeServer(options?: RealtimeServerOptions) {
  const port = options?.port ?? Number(process.env.REALTIME_PORT ?? 3001);
  const secret = options?.publishSecret ?? resolvePublishSecret();

  // The access token is stored raw at upgrade time (upgrade must run
  // synchronously) and authenticated lazily on the first message.
  const server = Bun.serve<{
    token: string | null;
    user?: RealtimeUser | null;
  }>({
    port,
    fetch(request, self) {
      const url = new URL(request.url);
      if (url.pathname === "/health") return json({ ok: true });
      if (url.pathname === "/publish" && request.method === "POST") {
        return handlePublish(request, self, secret);
      }
      if (url.pathname === "/ws") {
        const upgraded = self.upgrade(request, {
          data: { token: readCookie(request, ACCESS_COOKIE) },
        });
        if (upgraded) return undefined as unknown as Response;
        return json({ errors: { form: "Can not upgrade." } }, 400);
      }
      return json({ errors: { form: "Not found." } }, 404);
    },
    websocket: {
      open() {},
      message(ws, raw) {
        void handleSocketMessage(server, ws, raw);
      },
      close() {},
    },
  });
  return server;
}

async function handlePublish(
  request: Request,
  self: { publish: (topic: string, data: string) => void },
  secret: string,
): Promise<Response> {
  if (!secret || request.headers.get("x-realtime-secret") !== secret) {
    return json({ errors: { form: "Forbidden." } }, 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ errors: { form: "Invalid payload." } }, 400);
  }
  const event = body as { topic?: unknown; payload?: unknown };
  if (!isValidTopic(event.topic) || event.payload === undefined) {
    return json({ errors: { form: "Invalid payload." } }, 400);
  }
  if (payloadTooLarge(event.payload)) {
    return json({ errors: { form: "Payload too large." } }, 413);
  }
  self.publish(
    event.topic,
    encodeServerMessage({
      type: "event",
      topic: event.topic,
      payload: event.payload,
      from: "server",
    }),
  );
  return json({ ok: true });
}

type Socket = {
  data: { token: string | null; user?: RealtimeUser | null };
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  send: (data: string) => void;
};

async function socketUser(ws: Socket): Promise<RealtimeUser | null> {
  if (ws.data.user === undefined) {
    ws.data.user = await userFromToken(ws.data.token);
  }
  return ws.data.user;
}

async function handleSocketMessage(
  server: { publish: (topic: string, data: string) => void },
  ws: Socket,
  raw: string | Buffer,
): Promise<void> {
  const text = typeof raw === "string" ? raw : raw.toString("utf8");
  if (text.length > MAX_PAYLOAD_BYTES) {
    ws.send(encodeServerMessage({ type: "error", message: "Too large." }));
    return;
  }
  const msg = parseClientMessage(text);
  if (!msg) {
    ws.send(encodeServerMessage({ type: "error", message: "Invalid." }));
    return;
  }
  switch (msg.type) {
    case "ping":
      ws.send(encodeServerMessage({ type: "pong" }));
      return;
    case "subscribe": {
      const subscriber = await socketUser(ws);
      if (!canSubscribe(subscriber, msg.topic)) {
        ws.send(encodeServerMessage({ type: "error", message: "Forbidden." }));
        return;
      }
      ws.subscribe(msg.topic);
      ws.send(encodeServerMessage({ type: "subscribed", topic: msg.topic }));
      return;
    }
    case "unsubscribe":
      ws.unsubscribe(msg.topic);
      ws.send(encodeServerMessage({ type: "unsubscribed", topic: msg.topic }));
      return;
    case "publish": {
      const user = await socketUser(ws);
      if (!user || !canPublish(user, msg.topic)) {
        ws.send(encodeServerMessage({ type: "error", message: "Forbidden." }));
        return;
      }
      if (payloadTooLarge(msg.payload)) {
        ws.send(encodeServerMessage({ type: "error", message: "Too large." }));
        return;
      }
      const publish: PublishContext["publish"] = (topic, payload, from) => {
        server.publish(
          topic,
          encodeServerMessage({ type: "event", topic, payload, from }),
        );
      };
      const entry = handlers.find((h) => msg.topic.startsWith(h.prefix));
      try {
        if (entry)
          await entry.handler({
            user,
            topic: msg.topic,
            payload: msg.payload,
            publish,
          });
        else publish(msg.topic, msg.payload, user.id);
      } catch {
        ws.send(encodeServerMessage({ type: "error", message: "Failed." }));
      }
      return;
    }
  }
}

if (import.meta.main) {
  const server = startRealtimeServer();
  console.log(`[realtime] listening on :${server.port}`);
}
