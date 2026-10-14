import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  bookingTopic,
  bookingTrackTopic,
  OPERATIONS_TOPIC,
  orderTopic,
  rescueTopic,
} from "@/lib/realtime/protocol";
import { startRealtimeServer } from "@/realtime/server";
import {
  deniedSubscribe,
  mailbox,
  openSocket,
  publishEvent,
  subscribeTopic,
} from "../helpers/realtime-server";

const SECRET = "test-track-secret";
const ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

let base = "";
let port = 0;
let server: ReturnType<typeof startRealtimeServer>;

beforeAll(() => {
  server = startRealtimeServer({ port: 0, publishSecret: SECRET });
  port = server.port ?? 0;
  base = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.stop();
});

describe("guest tracking realtime", () => {
  test("guests subscribe to public track topics and get status events", async () => {
    const guest = await openSocket(port);
    const box = mailbox(guest);
    try {
      const order = orderTopic(ID);
      const rescue = rescueTopic(ID);
      const bookingTrack = bookingTrackTopic(ID);
      await subscribeTopic(guest, box, order);
      await subscribeTopic(guest, box, rescue);
      await subscribeTopic(guest, box, bookingTrack);

      // Anonymous ping stays alive while only public topics are held.
      guest.send('{"type":"ping"}');
      expect(JSON.parse(await box.next())).toEqual({ type: "pong" });

      const published = await publishEvent(base, SECRET, order, {
        kind: "order-updated",
        orderId: ID,
        status: "shipping",
      });
      expect(published.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: order,
        payload: { kind: "order-updated", orderId: ID },
      });

      const rescuePublished = await publishEvent(base, SECRET, rescue, {
        kind: "rescue-updated",
        rescueId: ID,
        status: "dispatched",
      });
      expect(rescuePublished.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: rescue,
      });

      const bookingPublished = await publishEvent(base, SECRET, bookingTrack, {
        kind: "booking-updated",
        bookingId: ID,
        status: "confirmed",
      });
      expect(bookingPublished.status).toBe(200);
      expect(JSON.parse(await box.next())).toMatchObject({
        type: "event",
        topic: bookingTrack,
      });
    } finally {
      guest.close();
    }
  });

  test("guests stay denied on private topics", async () => {
    const guest = await openSocket(port);
    const box = mailbox(guest);
    try {
      await deniedSubscribe(guest, box, bookingTopic(ID));
      await deniedSubscribe(guest, box, OPERATIONS_TOPIC);
    } finally {
      guest.close();
    }
  });
});
