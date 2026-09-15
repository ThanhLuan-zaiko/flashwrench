import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";

const adminUser = makePublicUser({ id: "admin-1", role: "admin" });
const customerUser = makePublicUser({ id: "cust-1", role: "customer" });

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, so the gateway authenticates by token.
mock.module("@/lib/auth/auth.service", () => ({
  authenticate: mock(async (token: string) => {
    if (token === "admin-token") return adminUser;
    if (token === "customer-token") return customerUser;
    return null;
  }),
}));

import { STAFF_PASSWORDS_TOPIC } from "@/lib/realtime/protocol";
import { startRealtimeServer } from "@/realtime/server";

const SECRET = "test-publish-secret";
let base = "";
let port = 0;
let server: ReturnType<typeof startRealtimeServer>;

// Buffered mailbox: WS frames can arrive before the test awaits them (the
// /publish HTTP response and the broadcast race), so every frame is queued
// and `next()` drains in order instead of dropping early arrivals.
function mailbox(ws: WebSocket): { next: () => Promise<string> } {
  const queue: string[] = [];
  const waiters: Array<(value: string) => void> = [];
  ws.onmessage = (event) => {
    const text = String(event.data);
    const waiter = waiters.shift();
    if (waiter) waiter(text);
    else queue.push(text);
  };
  return {
    next: () =>
      new Promise<string>((resolve, reject) => {
        const queued = queue.shift();
        if (queued !== undefined) {
          resolve(queued);
          return;
        }
        const timer = setTimeout(() => reject(new Error("Timed out.")), 5000);
        waiters.push((value) => {
          clearTimeout(timer);
          resolve(value);
        });
      }),
  };
}

async function openSocket(token?: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
    headers: token ? { Cookie: `fw_at=${token}` } : {},
  } as never);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out.")), 5000);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve();
    };
    ws.onerror = () => reject(new Error("Connect failed."));
  });
  return ws;
}

beforeAll(() => {
  server = startRealtimeServer({ port: 0, publishSecret: SECRET });
  port = server.port ?? 0;
  base = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.stop();
});

describe("realtime gateway", () => {
  test("answers health checks", async () => {
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
  });

  test("lets admins subscribe and fans out /publish events", async () => {
    const ws = await openSocket("admin-token");
    const box = mailbox(ws);
    try {
      ws.send(
        JSON.stringify({ type: "subscribe", topic: STAFF_PASSWORDS_TOPIC }),
      );
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "subscribed",
        topic: STAFF_PASSWORDS_TOPIC,
      });
      const published = await fetch(`${base}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-realtime-secret": SECRET,
        },
        body: JSON.stringify({
          topic: STAFF_PASSWORDS_TOPIC,
          payload: { kind: "changed", userId: "u1" },
        }),
      });
      expect(published.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: STAFF_PASSWORDS_TOPIC,
        payload: { kind: "changed", userId: "u1" },
        from: "server",
      });
    } finally {
      ws.close();
    }
  });

  test("rejects forbidden subscriptions and bad publish secrets", async () => {
    const ws = await openSocket("customer-token");
    const box = mailbox(ws);
    try {
      ws.send(
        JSON.stringify({ type: "subscribe", topic: STAFF_PASSWORDS_TOPIC }),
      );
      expect(JSON.parse(await box.next())).toMatchObject({ type: "error" });
    } finally {
      ws.close();
    }
    const denied = await fetch(`${base}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-realtime-secret": "wrong",
      },
      body: JSON.stringify({ topic: STAFF_PASSWORDS_TOPIC, payload: {} }),
    });
    expect(denied.status).toBe(403);
  });

  test("supports two-way client publishes on allowed topics", async () => {
    const a = await openSocket("customer-token");
    const b = await openSocket("customer-token");
    const boxA = mailbox(a);
    const boxB = mailbox(b);
    try {
      a.send(JSON.stringify({ type: "subscribe", topic: "booking:b1:chat" }));
      expect(JSON.parse(await boxA.next())).toMatchObject({
        type: "subscribed",
      });
      b.send(
        JSON.stringify({
          type: "publish",
          topic: "booking:b1:chat",
          payload: { text: "Em tới nơi rồi" },
        }),
      );
      expect(JSON.parse(await boxA.next())).toMatchObject({
        type: "event",
        topic: "booking:b1:chat",
        payload: { text: "Em tới nơi rồi" },
        from: "cust-1",
      });
      b.send(
        JSON.stringify({
          type: "publish",
          topic: STAFF_PASSWORDS_TOPIC,
          payload: {},
        }),
      );
      expect(JSON.parse(await boxB.next())).toMatchObject({
        type: "error",
      });
    } finally {
      a.close();
      b.close();
    }
  });

  test("answers ping and rejects garbage", async () => {
    const ws = await openSocket("admin-token");
    const box = mailbox(ws);
    try {
      ws.send('{"type":"ping"}');
      expect(JSON.parse(await box.next())).toEqual({ type: "pong" });
      ws.send("not-json");
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "error",
      });
    } finally {
      ws.close();
    }
  });

  test("defaults the publish secret to AUTH_SECRET like Next routes", async () => {
    process.env.AUTH_SECRET = "shared-secret-for-test-00000000000000";
    const second = startRealtimeServer({ port: 0 });
    try {
      const res = await fetch(`http://127.0.0.1:${second.port ?? 0}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-realtime-secret": "shared-secret-for-test-00000000000000",
        },
        body: JSON.stringify({ topic: "booking:b1", payload: {} }),
      });
      expect(res.status).toBe(200);
    } finally {
      second.stop();
      delete process.env.AUTH_SECRET;
    }
  });
});
