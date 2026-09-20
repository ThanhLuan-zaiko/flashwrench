import { describe, expect, test } from "bun:test";
import {
  ADMIN_USERS_TOPIC,
  BOOKING_ASSIGNED_EVENT_KIND,
  BOOKING_CREATED_EVENT_KIND,
  bookingChatTopic,
  bookingIdFromTopic,
  bookingTopic,
  COMPLAINTS_TOPIC,
  canPublish,
  canSubscribe,
  emergencyZoneTopic,
  MECHANIC_DIRECTORY_TOPIC,
  OPERATIONS_TOPIC,
  parseBookingInboxEvent,
  parseClientMessage,
  parseDomainEvent,
  parseServerMessage,
  SERVICE_CATALOG_TOPIC,
  STAFF_PASSWORDS_TOPIC,
  userTopic,
} from "@/lib/realtime/protocol";

const ADMIN = { id: "admin-1", role: "admin" as const };
const DISPATCHER = { id: "disp-1", role: "dispatcher" as const };
const MECHANIC = { id: "mech-1", role: "mechanic" as const };
const CUSTOMER = { id: "cust-1", role: "customer" as const };

describe("realtime protocol", () => {
  test("parses valid client messages", () => {
    expect(parseClientMessage('{"type":"ping"}')).toEqual({ type: "ping" });
    expect(
      parseClientMessage(
        JSON.stringify({ type: "subscribe", topic: STAFF_PASSWORDS_TOPIC }),
      ),
    ).toEqual({ type: "subscribe", topic: STAFF_PASSWORDS_TOPIC });
    expect(
      parseClientMessage(
        JSON.stringify({
          type: "publish",
          topic: "booking:1:chat",
          payload: { text: "hi" },
        }),
      ),
    ).toEqual({
      type: "publish",
      topic: "booking:1:chat",
      payload: { text: "hi" },
    });
  });

  test("rejects malformed messages", () => {
    expect(parseClientMessage("not-json")).toBeNull();
    expect(parseClientMessage(null)).toBeNull();
    expect(parseClientMessage('{"type":"subscribe"}')).toBeNull();
    expect(
      parseClientMessage('{"type":"subscribe","topic":"HAS SPACE"}'),
    ).toBeNull();
    expect(
      parseClientMessage('{"type":"publish","topic":"booking:1:chat"}'),
    ).toBeNull();
    expect(parseClientMessage('{"type":"unknown"}')).toBeNull();
  });

  test("guards topic subscriptions by role", () => {
    expect(canSubscribe(null, STAFF_PASSWORDS_TOPIC)).toBe(false);
    expect(canSubscribe(ADMIN, STAFF_PASSWORDS_TOPIC)).toBe(true);
    expect(canSubscribe(MECHANIC, STAFF_PASSWORDS_TOPIC)).toBe(false);
    expect(canSubscribe(CUSTOMER, userTopic("cust-1"))).toBe(true);
    expect(canSubscribe(CUSTOMER, userTopic("other"))).toBe(false);
    expect(canSubscribe(ADMIN, userTopic("other"))).toBe(true);
    expect(canSubscribe(CUSTOMER, emergencyZoneTopic("z1"))).toBe(false);
    expect(canSubscribe(MECHANIC, emergencyZoneTopic("z1"))).toBe(true);
    expect(canSubscribe(ADMIN, "made-up-topic")).toBe(false);
  });

  test("keeps server-only topics closed to browser publishes", () => {
    expect(canPublish(ADMIN, STAFF_PASSWORDS_TOPIC)).toBe(false);
    expect(canPublish(ADMIN, userTopic("admin-1"))).toBe(false);
    expect(canPublish(CUSTOMER, bookingChatTopic("b1"))).toBe(true);
    expect(canPublish(CUSTOMER, emergencyZoneTopic("z1"))).toBe(false);
    expect(canPublish(MECHANIC, emergencyZoneTopic("z1"))).toBe(false);
    expect(canPublish(ADMIN, emergencyZoneTopic("z1"))).toBe(false);
    expect(canPublish(DISPATCHER, emergencyZoneTopic("z1"))).toBe(false);
    expect(canPublish(null, bookingChatTopic("b1"))).toBe(false);
  });

  test("opens the service catalog to guests but never to publishers", () => {
    expect(canSubscribe(null, SERVICE_CATALOG_TOPIC)).toBe(true);
    expect(canSubscribe(CUSTOMER, SERVICE_CATALOG_TOPIC)).toBe(true);
    expect(canSubscribe(MECHANIC, SERVICE_CATALOG_TOPIC)).toBe(true);
    expect(canSubscribe(ADMIN, SERVICE_CATALOG_TOPIC)).toBe(true);
    expect(canPublish(ADMIN, SERVICE_CATALOG_TOPIC)).toBe(false);
    expect(canPublish(CUSTOMER, SERVICE_CATALOG_TOPIC)).toBe(false);
    expect(canPublish(null, SERVICE_CATALOG_TOPIC)).toBe(false);
  });

  test("parses mechanic inbox booking notices and ignores the rest", () => {
    expect(
      parseBookingInboxEvent({
        kind: BOOKING_CREATED_EVENT_KIND,
        bookingId: "b1",
        status: "pending",
      }),
    ).toEqual({ kind: "booking-created", bookingId: "b1", status: "pending" });
    expect(
      parseBookingInboxEvent({
        kind: BOOKING_ASSIGNED_EVENT_KIND,
        bookingId: "b2",
        status: "pending",
      }),
    ).toEqual({ kind: "booking-assigned", bookingId: "b2", status: "pending" });
    expect(parseBookingInboxEvent({ kind: "locked" })).toBeNull();
    expect(parseBookingInboxEvent(null)).toBeNull();
    expect(
      parseBookingInboxEvent({ kind: BOOKING_CREATED_EVENT_KIND }),
    ).toBeNull();
    expect(
      parseBookingInboxEvent({
        kind: BOOKING_CREATED_EVENT_KIND,
        bookingId: "",
        status: "pending",
      }),
    ).toBeNull();
  });

  test("gates the shared domain topics by role", () => {
    expect(canSubscribe(null, MECHANIC_DIRECTORY_TOPIC)).toBe(true);
    expect(canSubscribe(CUSTOMER, MECHANIC_DIRECTORY_TOPIC)).toBe(true);
    expect(canSubscribe(null, OPERATIONS_TOPIC)).toBe(false);
    expect(canSubscribe(CUSTOMER, OPERATIONS_TOPIC)).toBe(false);
    expect(canSubscribe(MECHANIC, OPERATIONS_TOPIC)).toBe(false);
    expect(canSubscribe(DISPATCHER, OPERATIONS_TOPIC)).toBe(true);
    expect(canSubscribe(ADMIN, OPERATIONS_TOPIC)).toBe(true);
    expect(canSubscribe(DISPATCHER, ADMIN_USERS_TOPIC)).toBe(false);
    expect(canSubscribe(ADMIN, ADMIN_USERS_TOPIC)).toBe(true);
    expect(canSubscribe(DISPATCHER, COMPLAINTS_TOPIC)).toBe(false);
    expect(canSubscribe(MECHANIC, COMPLAINTS_TOPIC)).toBe(false);
    expect(canSubscribe(ADMIN, COMPLAINTS_TOPIC)).toBe(true);
  });

  test("never lets browsers publish to the shared domain topics", () => {
    for (const topic of [
      OPERATIONS_TOPIC,
      ADMIN_USERS_TOPIC,
      COMPLAINTS_TOPIC,
      MECHANIC_DIRECTORY_TOPIC,
      bookingTopic("b1"),
      userTopic("cust-1"),
    ]) {
      expect(canPublish(ADMIN, topic)).toBe(false);
      expect(canPublish(DISPATCHER, topic)).toBe(false);
      expect(canPublish(MECHANIC, topic)).toBe(false);
    }
  });

  test("extracts booking ids from booking topics only", () => {
    expect(bookingIdFromTopic("booking:b1")).toBe("b1");
    expect(bookingIdFromTopic("booking:b1:chat")).toBe("b1");
    expect(bookingIdFromTopic("booking:")).toBeNull();
    expect(bookingIdFromTopic("booking:b1:chat:extra")).toBeNull();
    expect(bookingIdFromTopic("user:b1")).toBeNull();
    expect(bookingIdFromTopic("bookingx:b1")).toBeNull();
    expect(bookingIdFromTopic("operations")).toBeNull();
  });

  test("matches topic kinds strictly without suffix tricks", () => {
    expect(canSubscribe(ADMIN, "booking:b1:chat:chat")).toBe(false);
    expect(canSubscribe(ADMIN, "user:admin-1:extra")).toBe(false);
    expect(canSubscribe(MECHANIC, "emergency:zone:z1:extra")).toBe(false);
    expect(canSubscribe(ADMIN, "operations:ops")).toBe(false);
    expect(canSubscribe(CUSTOMER, "booking:b1:chat")).toBe(true);
    expect(canSubscribe(CUSTOMER, "booking:b1")).toBe(true);
  });

  test("validates every server message variant strictly", () => {
    expect(parseServerMessage(null)).toBeNull();
    expect(parseServerMessage("null")).toBeNull();
    expect(parseServerMessage("[]")).toBeNull();
    expect(parseServerMessage("[1,2]")).toBeNull();
    expect(parseServerMessage('"text"')).toBeNull();
    expect(parseServerMessage("42")).toBeNull();
    expect(parseServerMessage("not-json")).toBeNull();
    expect(parseServerMessage('{"type":"mystery"}')).toBeNull();
    expect(parseServerMessage("{}")).toBeNull();
    expect(
      parseServerMessage('{"type":"event","topic":"booking:b1"}'),
    ).toBeNull();
    expect(
      parseServerMessage('{"type":"event","topic":"BAD TOPIC","payload":{}}'),
    ).toBeNull();
    expect(
      parseServerMessage(
        '{"type":"event","topic":"booking:b1","payload":{},"from":7}',
      ),
    ).toBeNull();
    expect(parseServerMessage('{"type":"subscribed"}')).toBeNull();
    expect(
      parseServerMessage('{"type":"subscribed","topic":"HAS SPACE"}'),
    ).toBeNull();
    expect(parseServerMessage('{"type":"error"}')).toBeNull();
    expect(parseServerMessage('{"type":"error","message":5}')).toBeNull();
    expect(parseServerMessage('{"type":"pong"}')).toEqual({ type: "pong" });
    expect(
      parseServerMessage(
        '{"type":"event","topic":"booking:b1","payload":{"kind":"booking-updated"},"from":"server"}',
      ),
    ).toEqual({
      type: "event",
      topic: "booking:b1",
      payload: { kind: "booking-updated" },
      from: "server",
    });
    expect(
      parseServerMessage('{"type":"subscribed","topic":"booking:b1"}'),
    ).toEqual({ type: "subscribed", topic: "booking:b1" });
  });

  test("parses whitelisted domain events with optional fields", () => {
    expect(parseDomainEvent({ kind: "booking-created" })).toEqual({
      kind: "booking-created",
    });
    expect(
      parseDomainEvent({
        kind: "booking-updated",
        bookingId: "b1",
        status: "en_route",
      }),
    ).toEqual({ kind: "booking-updated", bookingId: "b1", status: "en_route" });
    expect(parseDomainEvent({ kind: "user-updated", userId: "u1" })).toEqual({
      kind: "user-updated",
      userId: "u1",
    });
    expect(
      parseDomainEvent({ kind: "payment-recorded", bookingId: "b1" }),
    ).toEqual({ kind: "payment-recorded", bookingId: "b1" });
    expect(parseDomainEvent({ kind: "review-created" })).toEqual({
      kind: "review-created",
    });
    expect(parseDomainEvent({ kind: "complaint-updated" })).toEqual({
      kind: "complaint-updated",
    });
    expect(parseDomainEvent({ kind: "mechanic-updated" })).toEqual({
      kind: "mechanic-updated",
    });
    expect(parseDomainEvent({ kind: "vehicle-updated" })).toEqual({
      kind: "vehicle-updated",
    });
  });

  test("rejects malformed domain events", () => {
    expect(parseDomainEvent(null)).toBeNull();
    expect(parseDomainEvent(undefined)).toBeNull();
    expect(parseDomainEvent([])).toBeNull();
    expect(parseDomainEvent("booking-created")).toBeNull();
    expect(parseDomainEvent({})).toBeNull();
    expect(parseDomainEvent({ kind: "unknown-kind" })).toBeNull();
    expect(parseDomainEvent({ kind: "locked" })).toBeNull();
    expect(parseDomainEvent({ kind: 42 })).toBeNull();
    expect(
      parseDomainEvent({ kind: "booking-updated", bookingId: 7 }),
    ).toBeNull();
    expect(
      parseDomainEvent({ kind: "booking-updated", bookingId: "" }),
    ).toBeNull();
    expect(parseDomainEvent({ kind: "user-updated", userId: null })).toBeNull();
    expect(
      parseDomainEvent({ kind: "booking-updated", status: {} }),
    ).toBeNull();
  });

  test("normalizes legacy booking-status payloads", () => {
    expect(
      parseDomainEvent({
        type: "booking-status",
        bookingId: "b1",
        status: "completed",
      }),
    ).toEqual({
      kind: "booking-updated",
      bookingId: "b1",
      status: "completed",
    });
    expect(parseDomainEvent({ type: "other-type" })).toBeNull();
  });
});
