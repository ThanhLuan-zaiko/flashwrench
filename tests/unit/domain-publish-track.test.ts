import { afterEach, describe, expect, mock, test } from "bun:test";

const calls: Array<{ topic: string; payload: unknown }> = [];
const originalFetch = globalThis.fetch;

function mockFetch(): void {
  calls.length = 0;
  (globalThis as Record<string, unknown>).fetch = mock(
    async (_url: unknown, init: unknown) => {
      const body = (init as { body?: string }).body ?? "{}";
      const parsed = JSON.parse(body) as { topic: string; payload: unknown };
      calls.push({ topic: parsed.topic, payload: parsed.payload });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  );
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  calls.length = 0;
});

import {
  publishBookingChange,
  publishOrderChange,
  publishRescueChange,
} from "@/lib/realtime/domain-publish";
import {
  bookingTrackTopic,
  orderTopic,
  rescueTopic,
} from "@/lib/realtime/protocol";

const ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("tracking fan-out", () => {
  test("booking changes reach the public track topic", async () => {
    mockFetch();
    await publishBookingChange("booking-updated", ID, "confirmed", null, []);
    const topics = calls.map((call) => call.topic);
    expect(topics).toContain(bookingTrackTopic(ID));
  });

  test("rescue changes reach the public rescue topic", async () => {
    mockFetch();
    await publishRescueChange(
      "rescue-updated",
      ID,
      "dispatched",
      null,
      [],
      null,
    );
    const topics = calls.map((call) => call.topic);
    expect(topics).toContain(rescueTopic(ID));
  });

  test("order changes reach public, operations and owner topics", async () => {
    mockFetch();
    await publishOrderChange(ID, "shipping", "cust-1");
    const topics = calls.map((call) => call.topic);
    expect(topics).toContain(orderTopic(ID));
    expect(topics).toContain("operations");
    expect(topics).toContain("user:cust-1");
    const orderPayload = calls.find((call) => call.topic === orderTopic(ID))
      ?.payload as Record<string, unknown>;
    expect(orderPayload?.kind).toBe("order-updated");
    expect(orderPayload?.orderId).toBe(ID);
  });

  test("guest orders still reach the public topic without an owner", async () => {
    mockFetch();
    await publishOrderChange(ID, "confirmed", null);
    const topics = calls.map((call) => call.topic);
    expect(topics).toContain(orderTopic(ID));
    expect(topics).not.toContain("user:cust-1");
  });
});
