// Pure mapper for the chat booking strip: row shaping and newest-first
// ordering. No mocks, no database.
import { describe, expect, test } from "bun:test";
import {
  sortBookingContexts,
  toChatBookingContext,
} from "@/lib/chat/chat-booking.types";
import { makeBookingRow } from "../helpers/mechanic.fixtures";

describe("toChatBookingContext", () => {
  test("maps a full row to the card shape", () => {
    const context = toChatBookingContext(makeBookingRow());
    expect(context.id).toBe("aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa");
    expect(context.status).toBe("pending");
    expect(context.vehiclePlate).toBe("51A-12345");
    expect(context.scheduledAt).toBe("2026-09-16T07:00:00.000Z");
    expect(context.total).toBe(450000);
  });

  test("degrades missing columns to safe defaults", () => {
    const context = toChatBookingContext(
      makeBookingRow({
        status: null,
        vehicle_plate: null,
        scheduled_at: null,
        total: null,
      }),
    );
    expect(context.status).toBe("pending");
    expect(context.vehiclePlate).toBe("");
    expect(context.scheduledAt).toBeNull();
    expect(context.total).toBe(0);
  });
});

describe("sortBookingContexts", () => {
  test("orders newest schedule first and sinks dateless rows", () => {
    const old = toChatBookingContext(
      makeBookingRow({
        booking_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
        scheduled_at: new Date("2026-09-14T07:00:00.000Z"),
      }),
    );
    const fresh = toChatBookingContext(
      makeBookingRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
      }),
    );
    const dateless = toChatBookingContext(
      makeBookingRow({
        booking_id: "cccccccc-3333-4333-8333-cccccccccccc",
        scheduled_at: null,
      }),
    );
    expect(
      sortBookingContexts([old, dateless, fresh]).map((item) => item.id),
    ).toEqual([
      "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
      "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
      "cccccccc-3333-4333-8333-cccccccccccc",
    ]);
  });
});
