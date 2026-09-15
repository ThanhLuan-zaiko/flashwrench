import { parseServerMessage } from "@/lib/realtime/protocol";

// Shared browser WebSocket with topic multiplexing. The whole page uses one
// socket no matter how many hooks subscribe; topics are reference-counted,
// resent on reconnect, and the socket backs off when the gateway is down.
// Publish from the browser returns false while disconnected so UIs can show
// a pending state instead of silently dropping messages.

type Listener = (payload: unknown) => void;

export type RealtimeStatus = "connecting" | "live" | "offline";

const listeners = new Map<string, Set<Listener>>();
const statusListeners = new Set<(status: RealtimeStatus) => void>();
let status: RealtimeStatus = "offline";
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;

function setStatus(next: RealtimeStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) {
    try {
      listener(next);
    } catch {
      return;
    }
  }
}

export function subscribeRealtimeStatus(
  listener: (status: RealtimeStatus) => void,
): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => {
    statusListeners.delete(listener);
  };
}

function gatewayUrl(): string {
  return resolveGatewayUrl();
}

// Default URL follows the page hostname so auth cookies (scoped to that
// host) are sent on the WebSocket handshake. `localhost:3000` with a
// hardcoded `127.0.0.1:3001` gateway would upgrade fine but arrive
// cookieless, and every protected subscribe would be denied in silence.
export function resolveGatewayUrl(): string {
  const override = process.env.NEXT_PUBLIC_REALTIME_URL;
  if (override) return override;
  const location = typeof window === "undefined" ? null : window.location;
  const host = location?.hostname || "127.0.0.1";
  const scheme = location?.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${host}:3001/ws`;
}

function sendJson(data: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null || listeners.size === 0) return;
  attempt += 1;
  const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 15000);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function connect(): void {
  if (
    typeof window === "undefined" ||
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING ||
    listeners.size === 0
  ) {
    return;
  }
  try {
    socket = new WebSocket(gatewayUrl());
    setStatus("connecting");
  } catch {
    scheduleReconnect();
    return;
  }
  socket.onopen = () => {
    attempt = 0;
    setStatus("live");
    for (const topic of listeners.keys()) {
      sendJson({ type: "subscribe", topic });
    }
  };
  socket.onmessage = (event) => {
    const msg = parseServerMessage(
      typeof event.data === "string" ? event.data : null,
    );
    if (!msg) return;
    // Denied subscribes must stay visible: otherwise the badge claims a
    // live socket while no topic actually delivers (e.g. missing cookie).
    if (msg.type === "error") {
      console.warn(`[realtime] ${msg.message}`);
      return;
    }
    if (msg.type !== "event") return;
    for (const listener of listeners.get(msg.topic) ?? []) {
      try {
        listener(msg.payload);
      } catch {
        return;
      }
    }
  };
  socket.onclose = () => {
    socket = null;
    setStatus(listeners.size === 0 ? "offline" : "connecting");
    scheduleReconnect();
  };
  socket.onerror = () => {
    try {
      socket?.close();
    } catch {
      return;
    }
  };
}

export function subscribeRealtimeTopic(
  topic: string,
  listener: Listener,
): () => void {
  let set = listeners.get(topic);
  if (!set) {
    set = new Set();
    listeners.set(topic, set);
  }
  set.add(listener);
  if (socket?.readyState === WebSocket.OPEN) {
    sendJson({ type: "subscribe", topic });
  } else {
    connect();
  }
  return () => {
    const current = listeners.get(topic);
    current?.delete(listener);
    if (current && current.size === 0) {
      listeners.delete(topic);
      sendJson({ type: "unsubscribe", topic });
    }
    if (listeners.size === 0) {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        socket?.close();
      } catch {
        return;
      }
      socket = null;
      setStatus("offline");
    }
  };
}

export function publishRealtimeTopic(topic: string, payload: unknown): boolean {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type: "publish", topic, payload }));
  return true;
}
