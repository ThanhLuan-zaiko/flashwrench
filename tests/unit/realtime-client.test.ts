import { afterEach, describe, expect, test } from "bun:test";
import { resolveGatewayUrl } from "@/lib/realtime/realtime-client";

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
