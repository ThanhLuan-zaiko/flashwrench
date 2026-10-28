import { describe, expect, test } from "bun:test";
import {
  CART_CHANGED_EVENT,
  crossTabNotice,
  parseCrossTabEvent,
  parseStoredCrossTabEvent,
  recordCreatedEvent,
} from "@/lib/cross-tab/cross-tab.protocol";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const SERVICE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SERVICE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("recordCreatedEvent", () => {
  test("builds a versioned event and keeps only uuid service ids", () => {
    const event = recordCreatedEvent("booking", BOOKING_ID, [
      SERVICE_A,
      "not-a-uuid",
      SERVICE_B,
    ]);
    expect(event).toEqual({
      v: 1,
      kind: "record-created",
      recordType: "booking",
      recordId: BOOKING_ID,
      serviceIds: [SERVICE_A, SERVICE_B],
    });
  });

  test("defaults to no service ids for orders and rescues", () => {
    expect(recordCreatedEvent("order", BOOKING_ID).serviceIds).toEqual([]);
  });
});

describe("parseCrossTabEvent", () => {
  test("round-trips a record-created event", () => {
    const event = recordCreatedEvent("booking", BOOKING_ID, [SERVICE_A]);
    expect(parseCrossTabEvent(structuredClone(event))).toEqual(event);
  });

  test("round-trips the cart-changed event", () => {
    expect(parseCrossTabEvent({ v: 1, kind: "cart-changed" })).toEqual(
      CART_CHANGED_EVENT,
    );
  });

  test("treats a missing service list as empty", () => {
    const parsed = parseCrossTabEvent({
      v: 1,
      kind: "record-created",
      recordType: "rescue",
      recordId: BOOKING_ID,
    });
    expect(parsed).toMatchObject({ kind: "record-created", serviceIds: [] });
  });

  // Anything that is not exactly our shape — another app version, an
  // extension posting on the same channel name, a tampered storage value —
  // must be dropped whole rather than half-applied.
  test("rejects foreign or malformed messages", () => {
    const valid = recordCreatedEvent("booking", BOOKING_ID, [SERVICE_A]);
    const rejected: unknown[] = [
      null,
      "cart-changed",
      [],
      { ...valid, v: 2 },
      { ...valid, kind: "record-deleted" },
      { ...valid, recordType: "invoice" },
      { ...valid, recordId: "not-a-uuid" },
      { ...valid, serviceIds: "abc" },
      { ...valid, serviceIds: ["not-a-uuid"] },
      { ...valid, serviceIds: Array.from({ length: 21 }, () => SERVICE_A) },
    ];
    for (const message of rejected) {
      expect(parseCrossTabEvent(message)).toBeNull();
    }
  });
});

describe("parseStoredCrossTabEvent", () => {
  test("unwraps the localStorage envelope", () => {
    const event = recordCreatedEvent("order", BOOKING_ID);
    const stored = JSON.stringify({ event, nonce: "1-abc" });
    expect(parseStoredCrossTabEvent(stored)).toEqual(event);
  });

  test("ignores removals, broken JSON and bad envelopes", () => {
    expect(parseStoredCrossTabEvent(null)).toBeNull();
    expect(parseStoredCrossTabEvent("{not json")).toBeNull();
    expect(parseStoredCrossTabEvent("42")).toBeNull();
    expect(parseStoredCrossTabEvent(JSON.stringify({ nonce: "x" }))).toBeNull();
  });
});

describe("crossTabNotice", () => {
  test("explains every record type in Vietnamese", () => {
    for (const type of ["booking", "order", "rescue"] as const) {
      const notice = crossTabNotice(recordCreatedEvent(type, BOOKING_ID));
      expect(notice?.title).toContain("tab khác");
      expect(notice?.description.length).toBeGreaterThan(0);
    }
  });

  test("stays silent for cart edits", () => {
    expect(crossTabNotice(CART_CHANGED_EVENT)).toBeNull();
  });
});
