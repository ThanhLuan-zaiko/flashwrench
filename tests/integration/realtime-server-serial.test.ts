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
import {
  mailbox,
  openSocket,
  publishEvent,
  subscribeTopic,
} from "../helpers/realtime-server";

const customerUser = makePublicUser({ id: "cust-1", role: "customer" });

mock.module("@/lib/auth/auth.service", () => ({
  authenticate: mock(async (token: string) => {
    if (token === "customer-token") return customerUser;
    return null;
  }),
}));

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import { bookingTopic, SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
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
  mechanicStubs.bookingById = makeBookingRow({
    customer_id: "cust-1",
    mechanic_id: "mech-1",
  });
});

afterAll(() => {
  server.stop();
});

describe("realtime gateway serial topic handling", () => {
  test("serializes a subscribe followed by an unsubscribe", async () => {
    const ws = await openSocket(port, "customer-token");
    const box = mailbox(ws);
    try {
      await subscribeTopic(ws, box, SERVICE_CATALOG_TOPIC);
      ws.send(JSON.stringify({ type: "subscribe", topic: bookingTopic("b1") }));
      ws.send(
        JSON.stringify({ type: "unsubscribe", topic: bookingTopic("b1") }),
      );
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "subscribed",
        topic: bookingTopic("b1"),
      });
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "unsubscribed",
        topic: bookingTopic("b1"),
      });
      await publishEvent(base, SECRET, bookingTopic("b1"), {
        kind: "booking-updated",
        bookingId: "b1",
      });
      const marker = await publishEvent(base, SECRET, SERVICE_CATALOG_TOPIC, {
        kind: "catalog-updated",
      });
      expect(marker.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: SERVICE_CATALOG_TOPIC,
      });
    } finally {
      ws.close();
    }
  });

  test("drops queued topic work when the socket closes mid-authorization", async () => {
    const repoMock = mechanicBookingsRepoMocks.findBookingRowById;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    repoMock.mockClear();
    repoMock.mockImplementation(async () => {
      await gate;
      return mechanicStubs.bookingById;
    });
    try {
      const ws = await openSocket(port, "customer-token");
      mailbox(ws);
      ws.send(JSON.stringify({ type: "subscribe", topic: bookingTopic("b1") }));
      ws.send(JSON.stringify({ type: "subscribe", topic: bookingTopic("b2") }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      ws.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
      release();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(repoMock.mock.calls).toEqual([["b1"]]);
    } finally {
      repoMock.mockReset();
      repoMock.mockImplementation(async () => mechanicStubs.bookingById);
    }
  });
});
