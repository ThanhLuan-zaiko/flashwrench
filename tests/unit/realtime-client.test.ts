import { afterEach, describe, expect, test } from "bun:test";
import {
  resolveGatewayUrl,
  subscribeRealtimeTopic,
} from "@/lib/realtime/realtime-client";

const WINDOW_KEY = "window";

function takeWindow(): unknown {
  const holder = globalThis as Record<string, unknown>;
  const saved = holder[WINDOW_KEY];
  delete holder[WINDOW_KEY];
  return saved;
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_REALTIME_URL;
});

describe("resolveGatewayUrl", () => {
  test("prefers the explicit override", () => {
    process.env.NEXT_PUBLIC_REALTIME_URL = "wss://realtime.example.com/ws";
    expect(resolveGatewayUrl()).toBe("wss://realtime.example.com/ws");
  });

  test("falls back to loopback without a page", () => {
    const saved = takeWindow();
    try {
      expect(resolveGatewayUrl()).toBe("ws://127.0.0.1:3001/ws");
    } finally {
      if (saved !== undefined) {
        (globalThis as Record<string, unknown>)[WINDOW_KEY] = saved;
      }
    }
  });

  test("follows the page hostname and scheme for cookies", () => {
    const holder = globalThis as Record<string, unknown>;
    const saved = holder[WINDOW_KEY];
    holder[WINDOW_KEY] = {
      location: { hostname: "example.com", protocol: "https:" },
    };
    try {
      expect(resolveGatewayUrl()).toBe("wss://example.com:3001/ws");
    } finally {
      if (saved === undefined) delete holder[WINDOW_KEY];
      else holder[WINDOW_KEY] = saved;
    }
  });
});

class FakeSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: unknown[] = [];

  constructor(public url: string) {
    fakeSockets.push(this);
  }

  send(data: unknown): void {
    this.sent.push(JSON.parse(String(data)));
  }

  close(): void {
    this.readyState = 3;
  }

  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }

  receive(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const fakeSockets: FakeSocket[] = [];
const originalWebSocket = globalThis.WebSocket;
const holder = globalThis as Record<string, unknown>;
const savedWindow = holder[WINDOW_KEY];

describe("subscribeRealtimeTopic acks", () => {
  test("fires onReady once even if the gateway re-acks the topic", () => {
    holder[WINDOW_KEY] = { location: { hostname: "x", protocol: "http:" } };
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
    process.env.NEXT_PUBLIC_REALTIME_URL = "ws://127.0.0.1:3001/ws";
    let readyCount = 0;
    const events: unknown[] = [];
    const unsubscribe = subscribeRealtimeTopic(
      "admin-users",
      (payload) => events.push(payload),
      () => {
        readyCount += 1;
      },
    );
    const ws = fakeSockets.at(-1);
    if (!ws) throw new Error("no socket opened");
    ws.open();
    ws.receive({ type: "subscribed", topic: "admin-users" });
    ws.receive({ type: "subscribed", topic: "admin-users" });
    expect(readyCount).toBe(1);

    ws.receive({ type: "event", topic: "admin-users", payload: { a: 1 } });
    expect(events).toEqual([{ a: 1 }]);
    unsubscribe();
  });
});

afterEach(() => {
  globalThis.WebSocket = originalWebSocket;
  if (savedWindow === undefined) delete holder[WINDOW_KEY];
  else holder[WINDOW_KEY] = savedWindow;
  fakeSockets.length = 0;
});
