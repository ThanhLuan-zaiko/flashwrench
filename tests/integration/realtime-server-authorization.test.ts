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
  deniedSubscribe,
  mailbox,
  openSocket,
  publishEvent,
  subscribeTopic,
  wsClosed,
} from "../helpers/realtime-server";

const adminUser = makePublicUser({ id: "admin-1", role: "admin" });
const dispatcherUser = makePublicUser({ id: "disp-1", role: "dispatcher" });
const customerUser = makePublicUser({ id: "cust-1", role: "customer" });
const otherCustomerUser = makePublicUser({ id: "cust-2", role: "customer" });
const mechanicUser = makePublicUser({ id: "mech-1", role: "mechanic" });
const otherMechanicUser = makePublicUser({ id: "mech-2", role: "mechanic" });

const revokedTokens = new Set<string>();

mock.module("@/lib/auth/auth.service", () => ({
  authenticate: mock(async (token: string) => {
    if (revokedTokens.has(token)) return null;
    if (token === "admin-token") return adminUser;
    if (token === "dispatcher-token") return dispatcherUser;
    if (token === "customer-token") return customerUser;
    if (token === "other-customer-token") return otherCustomerUser;
    if (token === "mechanic-token") return mechanicUser;
    if (token === "other-mechanic-token") return otherMechanicUser;
    return null;
  }),
}));

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import {
  ADMIN_USERS_TOPIC,
  bookingChatTopic,
  bookingTopic,
  COMPLAINTS_TOPIC,
  MECHANIC_DIRECTORY_TOPIC,
  OPERATIONS_TOPIC,
  SERVICE_CATALOG_TOPIC,
  userTopic,
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

describe("realtime gateway authorization", () => {
  test("gates shared domain topics by role", async () => {
    const dispatcher = await openSocket(port, "dispatcher-token");
    const customer = await openSocket(port, "customer-token");
    const guest = await openSocket(port);
    const admin = await openSocket(port, "admin-token");
    const boxD = mailbox(dispatcher);
    const boxC = mailbox(customer);
    const boxG = mailbox(guest);
    const boxA = mailbox(admin);
    try {
      await subscribeTopic(dispatcher, boxD, OPERATIONS_TOPIC);
      await deniedSubscribe(customer, boxC, OPERATIONS_TOPIC);
      await deniedSubscribe(customer, boxC, COMPLAINTS_TOPIC);
      await subscribeTopic(admin, boxA, COMPLAINTS_TOPIC);
      await subscribeTopic(admin, boxA, ADMIN_USERS_TOPIC);
      await subscribeTopic(guest, boxG, MECHANIC_DIRECTORY_TOPIC);
      await deniedSubscribe(guest, boxG, OPERATIONS_TOPIC);
      customer.send(
        JSON.stringify({
          type: "publish",
          topic: OPERATIONS_TOPIC,
          payload: { kind: "booking-updated" },
        }),
      );
      expect(JSON.parse(await boxC.next())).toMatchObject({ type: "error" });
    } finally {
      dispatcher.close();
      customer.close();
      guest.close();
      admin.close();
    }
  });

  test("authorizes booking topics by participant, not just by login", async () => {
    const owner = await openSocket(port, "customer-token");
    const mechanic = await openSocket(port, "mechanic-token");
    const dispatcher = await openSocket(port, "dispatcher-token");
    const stranger = await openSocket(port, "other-customer-token");
    const otherMechanic = await openSocket(port, "other-mechanic-token");
    const guest = await openSocket(port);
    const boxO = mailbox(owner);
    const boxM = mailbox(mechanic);
    const boxD = mailbox(dispatcher);
    const boxS = mailbox(stranger);
    const boxOM = mailbox(otherMechanic);
    const boxG = mailbox(guest);
    try {
      await subscribeTopic(owner, boxO, bookingTopic("b1"));
      await subscribeTopic(mechanic, boxM, bookingTopic("b1"));
      await subscribeTopic(dispatcher, boxD, bookingTopic("b1"));
      await deniedSubscribe(stranger, boxS, bookingTopic("b1"));
      await deniedSubscribe(otherMechanic, boxOM, bookingTopic("b1"));
      await deniedSubscribe(guest, boxG, bookingTopic("b1"));

      stranger.send(
        JSON.stringify({
          type: "publish",
          topic: bookingChatTopic("b1"),
          payload: { text: "xin chao" },
        }),
      );
      expect(JSON.parse(await boxS.next())).toMatchObject({ type: "error" });

      await subscribeTopic(mechanic, boxM, bookingChatTopic("b1"));
      owner.send(
        JSON.stringify({
          type: "publish",
          topic: bookingChatTopic("b1"),
          payload: { text: "hello again" },
        }),
      );
      expect(JSON.parse(await boxM.next())).toMatchObject({
        type: "event",
        topic: bookingChatTopic("b1"),
        payload: { text: "hello again" },
        from: "cust-1",
      });
    } finally {
      owner.close();
      mechanic.close();
      dispatcher.close();
      stranger.close();
      otherMechanic.close();
      guest.close();
    }
  });

  test("delivers booking events only to current participants", async () => {
    const owner = await openSocket(port, "customer-token");
    const boxO = mailbox(owner);
    try {
      await subscribeTopic(owner, boxO, bookingTopic("b1"));
      const published = await publishEvent(base, SECRET, bookingTopic("b1"), {
        kind: "booking-updated",
        bookingId: "b1",
        status: "en_route",
      });
      expect(published.status).toBe(200);
      expect(JSON.parse(await boxO.next())).toMatchObject({
        type: "event",
        topic: bookingTopic("b1"),
        payload: { kind: "booking-updated", bookingId: "b1" },
        from: "server",
      });
    } finally {
      owner.close();
    }
  });

  test("stops delivery to a mechanic after reassignment", async () => {
    const stale = await openSocket(port, "mechanic-token");
    const boxS = mailbox(stale);
    try {
      await subscribeTopic(stale, boxS, bookingTopic("b1"));
      await subscribeTopic(stale, boxS, SERVICE_CATALOG_TOPIC);

      mechanicStubs.bookingById = makeBookingRow({
        customer_id: "cust-1",
        mechanic_id: "mech-2",
      });

      const reassigned = await publishEvent(base, SECRET, bookingTopic("b1"), {
        kind: "booking-updated",
        bookingId: "b1",
      });
      expect(reassigned.status).toBe(200);
      const marker = await publishEvent(base, SECRET, SERVICE_CATALOG_TOPIC, {
        kind: "catalog-updated",
      });
      expect(marker.status).toBe(200);
      expect(JSON.parse(await boxS.next())).toMatchObject({
        type: "unsubscribed",
        topic: bookingTopic("b1"),
      });
      expect(JSON.parse(await boxS.next())).toMatchObject({
        type: "event",
        topic: SERVICE_CATALOG_TOPIC,
      });
    } finally {
      stale.close();
    }
  });

  test("revoked sockets get only the terminal notice on their own topic", async () => {
    const ws = await openSocket(port, "customer-token");
    const box = mailbox(ws);
    const closed = wsClosed(ws);
    try {
      await subscribeTopic(ws, box, bookingTopic("b1"));
      await subscribeTopic(ws, box, userTopic("cust-1"));

      revokedTokens.add("customer-token");

      const privateEvent = await publishEvent(
        base,
        SECRET,
        bookingTopic("b1"),
        {
          kind: "booking-updated",
          bookingId: "b1",
        },
      );
      expect(privateEvent.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "unsubscribed",
        topic: bookingTopic("b1"),
      });

      const terminal = await publishEvent(base, SECRET, userTopic("cust-1"), {
        kind: "locked",
      });
      expect(terminal.status).toBe(200);

      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: userTopic("cust-1"),
        payload: { kind: "locked" },
        from: "server",
      });
      expect(await closed).toBe(1008);
    } finally {
      ws.close();
    }
  });

  test("expires private sockets on ping once the token dies", async () => {
    const ws = await openSocket(port, "customer-token");
    const box = mailbox(ws);
    const closed = wsClosed(ws);
    try {
      await subscribeTopic(ws, box, userTopic("cust-1"));
      ws.send('{"type":"ping"}');
      expect(JSON.parse(await box.next())).toEqual({ type: "pong" });

      revokedTokens.add("customer-token");
      ws.send('{"type":"ping"}');
      expect(JSON.parse(await box.next())).toMatchObject({ type: "error" });
      expect(await closed).toBe(1008);
    } finally {
      ws.close();
    }
  });

  test("lets anonymous public sockets ping", async () => {
    const ws = await openSocket(port);
    const box = mailbox(ws);
    try {
      await subscribeTopic(ws, box, SERVICE_CATALOG_TOPIC);
      ws.send('{"type":"ping"}');
      expect(JSON.parse(await box.next())).toEqual({ type: "pong" });
    } finally {
      ws.close();
    }
  });
});
