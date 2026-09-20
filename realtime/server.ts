// Reusable realtime gateway (Bun native WebSocket, two-way).
// Run with `bun run realtime` (default port 3001).
//
// Browser clients connect to /ws (cookie auth), then multiplex topics over
// one socket: subscribe/unsubscribe/publish/ping. Next.js routes fan out
// server-side events through POST /publish. See docs/realtime.md to add a
// topic or a publish handler for a new feature.

import { ACCESS_COOKIE } from "@/lib/auth/session";
import {
  authorizeTopic,
  realtimeUser,
} from "@/lib/realtime/authorization.service";
import {
  canPublish,
  canSubscribe,
  isValidTopic,
  parseClientMessage,
  type RealtimeUser,
  resolvePublishSecret,
} from "@/lib/realtime/protocol";
import {
  addSubscription,
  createRegistry,
  enqueueSocketTask,
  fanout,
  type RealtimeSocket,
  type RealtimeSocketData,
  removeSocket,
  removeSubscription,
  sendTo,
  type TopicRegistry,
} from "./registry";
import { isAllowedRealtimeOrigin } from "./security";

const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_SUBSCRIPTIONS_PER_SOCKET = 64;

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

function utf8Length(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function payloadTooLarge(payload: unknown): boolean {
  try {
    const text = JSON.stringify(payload);
    return text === undefined || utf8Length(text) > MAX_PAYLOAD_BYTES;
  } catch {
    return true;
  }
}

async function authenticateSocket(
  ws: RealtimeSocket,
): Promise<RealtimeUser | null> {
  try {
    const user = await realtimeUser(ws.data.token);
    if (user) ws.data.user = user;
    return user;
  } catch {
    return null;
  }
}

function hasPrivateSubscriptions(ws: RealtimeSocket): boolean {
  for (const topic of ws.data.subscriptions) {
    if (!canSubscribe(null, topic)) return true;
  }
  return false;
}

async function handlePing(ws: RealtimeSocket): Promise<void> {
  if (!hasPrivateSubscriptions(ws)) {
    sendTo(ws, { type: "pong" });
    return;
  }
  const user = await authenticateSocket(ws);
  if (user) {
    sendTo(ws, { type: "pong" });
    return;
  }
  sendTo(ws, { type: "error", message: "Session expired." });
  try {
    ws.close(1008, "Session expired.");
  } catch {
    return;
  }
}

async function handleSubscribe(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
): Promise<void> {
  let allowed = false;
  try {
    const user = await authenticateSocket(ws);
    allowed = await authorizeTopic(user, topic);
  } catch {
    allowed = false;
  }
  if (!allowed) {
    sendTo(ws, { type: "error", message: "Forbidden." });
    return;
  }
  if (ws.data.closed) return;
  if (!ws.data.subscriptions.has(topic)) {
    if (ws.data.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_SOCKET) {
      sendTo(ws, { type: "error", message: "Too many subscriptions." });
      return;
    }
    addSubscription(registry, ws, topic);
  }
  sendTo(ws, { type: "subscribed", topic });
}

async function handleUnsubscribe(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
): Promise<void> {
  removeSubscription(registry, ws, topic);
  sendTo(ws, { type: "unsubscribed", topic });
}

async function handleClientPublish(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
  payload: unknown,
): Promise<void> {
  const user = await authenticateSocket(ws);
  if (!user || !canPublish(user, topic)) {
    sendTo(ws, { type: "error", message: "Forbidden." });
    return;
  }
  let allowed = false;
  try {
    allowed = await authorizeTopic(user, topic);
  } catch {
    allowed = false;
  }
  if (!allowed) {
    sendTo(ws, { type: "error", message: "Forbidden." });
    return;
  }
  if (payloadTooLarge(payload)) {
    sendTo(ws, { type: "error", message: "Too large." });
    return;
  }
  const publish: PublishContext["publish"] = (target, body, from) => {
    void fanout(registry, target, body, from ?? user.id);
  };
  const entry = handlers.find((h) => topic.startsWith(h.prefix));
  try {
    if (entry) await entry.handler({ user, topic, payload, publish });
    else await fanout(registry, topic, payload, user.id);
  } catch {
    sendTo(ws, { type: "error", message: "Failed." });
  }
}

function handleSocketMessage(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  raw: string | Buffer,
): void {
  const text = typeof raw === "string" ? raw : raw.toString("utf8");
  const bytes = typeof raw === "string" ? utf8Length(raw) : raw.length;
  if (bytes > MAX_PAYLOAD_BYTES) {
    sendTo(ws, { type: "error", message: "Too large." });
    return;
  }
  const msg = parseClientMessage(text);
  if (!msg) {
    sendTo(ws, { type: "error", message: "Invalid." });
    return;
  }
  switch (msg.type) {
    case "ping":
      void handlePing(ws);
      return;
    case "subscribe":
      enqueueSocketTask(ws, () => handleSubscribe(registry, ws, msg.topic));
      return;
    case "unsubscribe":
      enqueueSocketTask(ws, () => handleUnsubscribe(registry, ws, msg.topic));
      return;
    case "publish":
      void handleClientPublish(registry, ws, msg.topic, msg.payload);
      return;
  }
}

async function handlePublish(
  request: Request,
  registry: TopicRegistry,
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
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ errors: { form: "Invalid payload." } }, 400);
  }
  const event = body as { topic?: unknown; payload?: unknown };
  if (!isValidTopic(event.topic) || event.payload === undefined) {
    return json({ errors: { form: "Invalid payload." } }, 400);
  }
  if (payloadTooLarge(event.payload)) {
    return json({ errors: { form: "Payload too large." } }, 413);
  }
  await fanout(registry, event.topic, event.payload);
  return json({ ok: true });
}

export type RealtimeServerOptions = {
  port?: number;
  publishSecret?: string;
};

export function startRealtimeServer(options?: RealtimeServerOptions) {
  const port = options?.port ?? Number(process.env.REALTIME_PORT ?? 3001);
  const secret = options?.publishSecret ?? resolvePublishSecret();
  const registry = createRegistry();

  // The access token is stored raw at upgrade time (upgrade must run
  // synchronously) and authenticated lazily on the first message.
  const server = Bun.serve<RealtimeSocketData>({
    port,
    fetch(request, self) {
      const url = new URL(request.url);
      if (url.pathname === "/health") return json({ ok: true });
      if (url.pathname === "/publish" && request.method === "POST") {
        return handlePublish(request, registry, secret);
      }
      if (url.pathname === "/ws") {
        if (
          !isAllowedRealtimeOrigin(request.url, request.headers.get("origin"))
        ) {
          return json({ errors: { form: "Forbidden." } }, 403);
        }
        const upgraded = self.upgrade(request, {
          data: {
            token: readCookie(request, ACCESS_COOKIE),
            subscriptions: new Set<string>(),
            queue: Promise.resolve(),
            closed: false,
          },
        });
        if (upgraded) return undefined as unknown as Response;
        return json({ errors: { form: "Can not upgrade." } }, 400);
      }
      return json({ errors: { form: "Not found." } }, 404);
    },
    websocket: {
      maxPayloadLength: MAX_PAYLOAD_BYTES,
      open() {},
      message(ws, raw) {
        handleSocketMessage(registry, ws, raw);
      },
      close(ws) {
        ws.data.closed = true;
        removeSocket(registry, ws);
      },
    },
  });
  return server;
}

if (import.meta.main) {
  const server = startRealtimeServer();
  console.log(`[realtime] listening on :${server.port}`);
}
