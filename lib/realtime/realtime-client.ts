import { parseServerMessage } from "@/lib/realtime/protocol";

// Shared browser WebSocket with topic multiplexing. The whole page uses one
// socket no matter how many hooks subscribe; topics are reference-counted,
// resent on reconnect, and the socket backs off when the gateway is down.
// Publish from the browser returns false while disconnected so UIs can show
// a pending state instead of silently dropping messages.

type Listener = (payload: unknown) => void;

export type RealtimeStatus = "connecting" | "live" | "offline";

const HEARTBEAT_INTERVAL_MS = 25 * 1000;
const HEARTBEAT_TIMEOUT_MS = 60 * 1000;

const listeners = new Map<string, Set<Listener>>();
const readyCallbacks = new Map<string, Map<Listener, () => void>>();
const readyTopics = new Set<string>();
const statusListeners = new Set<(status: RealtimeStatus) => void>();
let status: RealtimeStatus = "offline";
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let lastPongAt = 0;
let attempt = 0;

function notifyQuietly(listener: () => void): void {
  try {
    listener();
  } catch {
    return;
  }
}

function setStatus(next: RealtimeStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) {
    notifyQuietly(() => listener(next));
  }
}

export function subscribeRealtimeStatus(
  listener: (status: RealtimeStatus) => void,
): () => void {
  statusListeners.add(listener);
  notifyQuietly(() => listener(status));
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

function sendJson(ws: WebSocket | null, data: unknown): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function closeQuietly(ws: WebSocket | null): void {
  if (!ws) return;
  try {
    ws.close();
  } catch {
    return;
  }
}

function clearReconnectTimer(): void {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function stopHeartbeat(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat(ws: WebSocket): void {
  stopHeartbeat();
  lastPongAt = Date.now();
  heartbeatTimer = setInterval(() => {
    if (socket !== ws || ws.readyState !== WebSocket.OPEN) {
      stopHeartbeat();
      return;
    }
    if (Date.now() - lastPongAt > HEARTBEAT_TIMEOUT_MS) {
      stopHeartbeat();
      closeQuietly(ws);
      return;
    }
    sendJson(ws, { type: "ping" });
  }, HEARTBEAT_INTERVAL_MS);
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

function detachSocket(ws: WebSocket): void {
  ws.onopen = null;
  ws.onmessage = null;
  ws.onclose = null;
  ws.onerror = null;
}

function connect(): void {
  if (
    typeof window === "undefined" ||
    (socket !== null &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)) ||
    listeners.size === 0
  ) {
    return;
  }
  let ws: WebSocket;
  try {
    ws = new WebSocket(gatewayUrl());
  } catch {
    scheduleReconnect();
    return;
  }
  socket = ws;
  setStatus("connecting");
  ws.onopen = () => {
    if (socket !== ws) return;
    attempt = 0;
    setStatus("live");
    for (const topic of listeners.keys()) {
      sendJson(ws, { type: "subscribe", topic });
    }
    startHeartbeat(ws);
  };
  ws.onmessage = (event) => {
    if (socket !== ws) return;
    const msg = parseServerMessage(
      typeof event.data === "string" ? event.data : null,
    );
    if (!msg) return;
    if (msg.type === "pong") {
      lastPongAt = Date.now();
      return;
    }
    // Denied subscribes must stay visible: otherwise the badge claims a
    // live socket while no topic actually delivers (e.g. missing cookie).
    if (msg.type === "error") {
      console.warn(`[realtime] ${msg.message}`);
      setStatus("offline");
      return;
    }
    if (msg.type === "subscribed") {
      if (readyTopics.has(msg.topic)) return;
      readyTopics.add(msg.topic);
      const callbacks = readyCallbacks.get(msg.topic);
      if (callbacks) {
        for (const callback of callbacks.values()) {
          notifyQuietly(callback);
        }
      }
      return;
    }
    if (msg.type === "unsubscribed") {
      readyTopics.delete(msg.topic);
      return;
    }
    if (msg.type !== "event") return;
    for (const listener of listeners.get(msg.topic) ?? []) {
      notifyQuietly(() => listener(msg.payload));
    }
  };
  ws.onclose = () => {
    if (socket !== ws) return;
    socket = null;
    stopHeartbeat();
    readyTopics.clear();
    setStatus(listeners.size === 0 ? "offline" : "connecting");
    scheduleReconnect();
  };
  ws.onerror = () => {
    if (socket !== ws) return;
    closeQuietly(ws);
  };
}

export function reconnectRealtime(): void {
  clearReconnectTimer();
  stopHeartbeat();
  readyTopics.clear();
  const previous = socket;
  socket = null;
  if (previous) {
    detachSocket(previous);
    closeQuietly(previous);
  }
  attempt = 0;
  connect();
}

export function subscribeRealtimeTopic(
  topic: string,
  listener: Listener,
  onReady?: () => void,
): () => void {
  let set = listeners.get(topic);
  if (!set) {
    set = new Set();
    listeners.set(topic, set);
  }
  set.add(listener);
  if (onReady) {
    let callbacks = readyCallbacks.get(topic);
    if (!callbacks) {
      callbacks = new Map();
      readyCallbacks.set(topic, callbacks);
    }
    callbacks.set(listener, onReady);
  }
  if (socket?.readyState === WebSocket.OPEN) {
    if (set.size === 1) sendJson(socket, { type: "subscribe", topic });
    else if (onReady && readyTopics.has(topic)) notifyQuietly(onReady);
  } else {
    connect();
  }
  return () => {
    const current = listeners.get(topic);
    current?.delete(listener);
    readyCallbacks.get(topic)?.delete(listener);
    if (current && current.size === 0) {
      listeners.delete(topic);
      readyCallbacks.delete(topic);
      readyTopics.delete(topic);
      sendJson(socket, { type: "unsubscribe", topic });
    }
    if (listeners.size === 0) {
      clearReconnectTimer();
      stopHeartbeat();
      const previous = socket;
      socket = null;
      if (previous) {
        detachSocket(previous);
        closeQuietly(previous);
      }
      setStatus("offline");
    }
  };
}

export function publishRealtimeTopic(topic: string, payload: unknown): boolean {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type: "publish", topic, payload }));
  return true;
}
