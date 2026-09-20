import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
} from "../helpers/mechanic.mocks";
import { mailbox, openSocket, publishEvent } from "../helpers/realtime-server";

const adminUser = makePublicUser({ id: "admin-1", role: "admin" });
const customerUser = makePublicUser({ id: "cust-1", role: "customer" });

const revokedTokens = new Set<string>();

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, so the gateway authenticates by token.
mock.module("@/lib/auth/auth.service", () => ({
  authenticate: mock(async (token: string) => {
    if (revokedTokens.has(token)) return null;
    if (token === "admin-token") return adminUser;
    if (token === "customer-token") return customerUser;
    return null;
  }),
}));

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import {
  SERVICE_CATALOG_TOPIC,
  STAFF_PASSWORDS_TOPIC,
} from "@/lib/realtime/protocol";
import { startRealtimeServer } from "@/realtime/server";

const SECRET = "test-publish-secret";
let base = "";
let port = 0;
let server: ReturnType<typeof startRealtimeServer>;

beforeAll(() => {
  server = startRealtimeServer({ port: 0, publishSecret: SECRET });
  port = server.port ?? 0;
  base = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  revokedTokens.clear();
  mechanicStubs.bookingById = makeBookingRow({
    customer_id: "cust-1",
    mechanic_id: "mech-1",
  });
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
    const ws = await openSocket(port, "admin-token");
    const box = mailbox(ws);
    try {
      ws.send(
        JSON.stringify({ type: "subscribe", topic: STAFF_PASSWORDS_TOPIC }),
      );
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "subscribed",
        topic: STAFF_PASSWORDS_TOPIC,
      });
      const published = await publishEvent(
        base,
        SECRET,
        STAFF_PASSWORDS_TOPIC,
        {
          kind: "changed",
          userId: "u1",
        },
      );
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
    const ws = await openSocket(port, "customer-token");
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
    const a = await openSocket(port, "customer-token");
    const b = await openSocket(port, "customer-token");
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
    const ws = await openSocket(port, "admin-token");
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

  test("denies cross-origin upgrades and allows same-host ones", async () => {
    const crossOrigin = await fetch(`${base}/ws`, {
      headers: { Origin: "https://evil.example" },
    });
    expect(crossOrigin.status).toBe(403);

    const crossScheme = await fetch(`${base}/ws`, {
      headers: { Origin: "https://127.0.0.1:3000" },
    });
    expect(crossScheme.status).toBe(403);

    const sameHost = await fetch(`${base}/ws`, {
      headers: { Origin: "http://127.0.0.1:3000" },
    });
    expect(sameHost.status).toBe(400);

    const noOrigin = await fetch(`${base}/ws`);
    expect(noOrigin.status).toBe(400);

    process.env.REALTIME_ALLOWED_ORIGINS = "https://app.example.com";
    try {
      const listed = await fetch(`${base}/ws`, {
        headers: { Origin: "https://app.example.com" },
      });
      expect(listed.status).toBe(400);
      const unlisted = await fetch(`${base}/ws`, {
        headers: { Origin: "http://127.0.0.1:3000" },
      });
      expect(unlisted.status).toBe(403);
    } finally {
      delete process.env.REALTIME_ALLOWED_ORIGINS;
    }
  });

  test("rejects malformed /publish bodies instead of crashing", async () => {
    const headers = {
      "Content-Type": "application/json",
      "x-realtime-secret": SECRET,
    };
    for (const body of ["null", "[]", '"text"', "42"]) {
      const response = await fetch(`${base}/publish`, {
        method: "POST",
        headers,
        body,
      });
      expect(response.status).toBe(400);
    }
    for (const body of [
      { topic: "BAD TOPIC", payload: {} },
      { topic: "booking:b1" },
      { payload: {} },
    ]) {
      const response = await fetch(`${base}/publish`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      expect(response.status).toBe(400);
    }
  });

  test("rejects UTF-8 oversize /publish payloads with 413", async () => {
    const response = await fetch(`${base}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-realtime-secret": SECRET,
      },
      body: JSON.stringify({
        topic: SERVICE_CATALOG_TOPIC,
        payload: { text: "đ".repeat(40_000) },
      }),
    });
    expect(response.status).toBe(413);
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
