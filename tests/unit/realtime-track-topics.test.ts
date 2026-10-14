import { describe, expect, test } from "bun:test";
import {
  bookingIdFromTopic,
  bookingTopic,
  bookingTrackIdFromTopic,
  bookingTrackTopic,
  canPublish,
  canSubscribe,
  isPublicTrackTopic,
  orderIdFromTopic,
  orderTopic,
  rescueIdFromTopic,
  rescueTopic,
} from "@/lib/realtime/protocol";

const ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const CUSTOMER = { id: "cust-1", role: "customer" as const };
const MECHANIC = { id: "mech-1", role: "mechanic" as const };
const ADMIN = { id: "admin-1", role: "admin" as const };

describe("guest tracking topics", () => {
  test("builds stable public topic names", () => {
    expect(orderTopic(ID)).toBe(`order:${ID}`);
    expect(rescueTopic(ID)).toBe(`rescue:${ID}`);
    expect(bookingTrackTopic(ID)).toBe(`booking-track:${ID}`);
  });

  test("extracts ids from public topics only", () => {
    expect(orderIdFromTopic(orderTopic(ID))).toBe(ID);
    expect(rescueIdFromTopic(rescueTopic(ID))).toBe(ID);
    expect(bookingTrackIdFromTopic(bookingTrackTopic(ID))).toBe(ID);
    expect(orderIdFromTopic(bookingTopic(ID))).toBeNull();
    expect(rescueIdFromTopic(orderTopic(ID))).toBeNull();
    expect(bookingIdFromTopic(orderTopic(ID))).toBeNull();
    expect(orderIdFromTopic("order:")).toBeNull();
    expect(orderIdFromTopic("order:a:b")).toBeNull();
  });

  test("opens tracking topics to guests but never to publishers", () => {
    for (const topic of [
      orderTopic(ID),
      rescueTopic(ID),
      bookingTrackTopic(ID),
    ]) {
      expect(isPublicTrackTopic(topic)).toBe(true);
      expect(canSubscribe(null, topic)).toBe(true);
      expect(canSubscribe(CUSTOMER, topic)).toBe(true);
      expect(canSubscribe(MECHANIC, topic)).toBe(true);
      expect(canSubscribe(ADMIN, topic)).toBe(true);
      expect(canPublish(ADMIN, topic)).toBe(false);
      expect(canPublish(CUSTOMER, topic)).toBe(false);
      expect(canPublish(null, topic)).toBe(false);
    }
  });

  test("keeps private booking topics closed to guests", () => {
    expect(isPublicTrackTopic(bookingTopic(ID))).toBe(false);
    expect(canSubscribe(null, bookingTopic(ID))).toBe(false);
    expect(canSubscribe(CUSTOMER, bookingTopic(ID))).toBe(true);
  });

  test("rejects malformed tracking topics", () => {
    expect(canSubscribe(null, "order:")).toBe(false);
    expect(canSubscribe(null, "rescue:")).toBe(false);
    expect(canSubscribe(null, "booking-track:")).toBe(false);
    expect(canSubscribe(ADMIN, "order:a:b")).toBe(false);
    expect(canSubscribe(ADMIN, "booking-track:a:extra")).toBe(false);
  });
});
