import {
  authorizeTopic,
  realtimeUser,
} from "@/lib/realtime/authorization.service";
import {
  canSubscribe,
  encodeServerMessage,
  type RealtimeUser,
  type ServerMessage,
  userTopic,
} from "@/lib/realtime/protocol";

export type RealtimeSocketData = {
  token: string | null;
  user?: RealtimeUser | null;
  subscriptions: Set<string>;
  queue: Promise<void>;
  closed: boolean;
};

export type RealtimeSocket = {
  data: RealtimeSocketData;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
};

export type TopicRegistry = {
  topics: Map<string, Set<RealtimeSocket>>;
};

export function createRegistry(): TopicRegistry {
  return { topics: new Map() };
}

export function addSubscription(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
): void {
  let set = registry.topics.get(topic);
  if (!set) {
    set = new Set();
    registry.topics.set(topic, set);
  }
  set.add(ws);
  ws.data.subscriptions.add(topic);
}

export function removeSubscription(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
): void {
  const set = registry.topics.get(topic);
  if (set) {
    set.delete(ws);
    if (set.size === 0) registry.topics.delete(topic);
  }
  ws.data.subscriptions.delete(topic);
}

export function removeSocket(
  registry: TopicRegistry,
  ws: RealtimeSocket,
): void {
  for (const topic of ws.data.subscriptions) {
    const set = registry.topics.get(topic);
    if (set) {
      set.delete(ws);
      if (set.size === 0) registry.topics.delete(topic);
    }
  }
  ws.data.subscriptions.clear();
}

export function subscribersForTopic(
  registry: TopicRegistry,
  topic: string,
): Set<RealtimeSocket> {
  return registry.topics.get(topic) ?? new Set();
}

export function sendTo(ws: RealtimeSocket, msg: ServerMessage): void {
  if (ws.data.closed) return;
  try {
    ws.send(encodeServerMessage(msg));
  } catch {
    return;
  }
}

export function enqueueSocketTask(
  ws: RealtimeSocket,
  task: () => Promise<void>,
): void {
  ws.data.queue = ws.data.queue.then(async () => {
    if (ws.data.closed) return;
    try {
      await task();
    } catch {
      return;
    }
  });
}

const TERMINAL_NOTICE_KINDS = new Set(["locked", "deleted"]);

function isTerminalOwnNotice(
  ws: RealtimeSocket,
  topic: string,
  payload: unknown,
  from: string,
): boolean {
  if (from !== "server") return false;
  const user = ws.data.user;
  if (!user || topic !== userTopic(user.id)) return false;
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return false;
  }
  const kind = (payload as { kind?: unknown }).kind;
  return typeof kind === "string" && TERMINAL_NOTICE_KINDS.has(kind);
}

async function fanoutOne(
  registry: TopicRegistry,
  ws: RealtimeSocket,
  topic: string,
  payload: unknown,
  from: string,
): Promise<void> {
  if (ws.data.closed || !ws.data.subscriptions.has(topic)) return;
  if (canSubscribe(null, topic)) {
    sendTo(ws, { type: "event", topic, payload, from });
    return;
  }
  let allowed = false;
  try {
    const user = await realtimeUser(ws.data.token);
    if (user) ws.data.user = user;
    allowed = await authorizeTopic(user, topic);
  } catch {
    ws.data.closed = true;
    removeSocket(registry, ws);
    try {
      ws.close(1011, "Retry connection.");
    } catch {
      return;
    }
    return;
  }
  if (ws.data.closed || !ws.data.subscriptions.has(topic)) return;
  if (allowed) {
    sendTo(ws, { type: "event", topic, payload, from });
    return;
  }
  if (isTerminalOwnNotice(ws, topic, payload, from)) {
    sendTo(ws, { type: "event", topic, payload, from });
    ws.data.closed = true;
    removeSocket(registry, ws);
    try {
      ws.close(1008, "Session ended.");
    } catch {
      return;
    }
    return;
  }
  removeSubscription(registry, ws, topic);
  sendTo(ws, { type: "unsubscribed", topic });
}

export async function fanout(
  registry: TopicRegistry,
  topic: string,
  payload: unknown,
  from = "server",
): Promise<void> {
  await Promise.all(
    [...subscribersForTopic(registry, topic)].map((ws) =>
      fanoutOne(registry, ws, topic, payload, from),
    ),
  );
}
