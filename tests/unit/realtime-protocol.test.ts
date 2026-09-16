import { describe, expect, test } from "bun:test";
import {
  bookingChatTopic,
  canPublish,
  canSubscribe,
  emergencyZoneTopic,
  parseClientMessage,
  SERVICE_CATALOG_TOPIC,
  STAFF_PASSWORDS_TOPIC,
  userTopic,
} from "@/lib/realtime/protocol";

const ADMIN = { id: "admin-1", role: "admin" as const };
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
    expect(canPublish(MECHANIC, emergencyZoneTopic("z1"))).toBe(true);
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
});
