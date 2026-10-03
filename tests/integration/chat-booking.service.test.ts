// Booking strip guards: membership is required, only bookings shared by
// the thread pair are shown, and storage is never touched on rejection.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  bookingStubs,
  customerBookingsRepoMocks,
  resetBookingMocks,
} from "../helpers/booking.mocks";
import {
  chatRepoMocks,
  chatStubs,
  makeInboxRow,
  resetChatMocks,
} from "../helpers/chat.mocks";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/chat/chat.repository", () => chatRepoMocks);
mock.module(
  "@/lib/booking/customer-bookings.repository",
  () => customerBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import { getThreadBookings } from "@/lib/chat/chat-booking.service";

const THREAD_ID = "dddddddd-2222-4222-8222-dddddddddddd";

const customer = { id: CUSTOMER_ID, role: "customer" as const };
const outsider = { id: MECHANIC_OTHER_ID, role: "mechanic" as const };

function seedThread() {
  chatStubs.threadById = {
    thread_id: THREAD_ID,
    customer_id: CUSTOMER_ID,
    mechanic_id: MECHANIC_ID,
    created_at: new Date("2026-09-16T07:00:00.000Z"),
    last_message_at: null,
    last_message_preview: null,
    last_message_sender: null,
  };
  const row = makeInboxRow({
    user_id: CUSTOMER_ID,
    thread_id: THREAD_ID,
    peer_id: MECHANIC_ID,
  });
  chatStubs.inboxByUser.set(`${CUSTOMER_ID}:${THREAD_ID}`, row);
}

beforeEach(() => {
  resetChatMocks();
  resetMechanicMocks();
  resetBookingMocks();
  seedThread();
});

describe("getThreadBookings", () => {
  test("returns only bookings shared by the thread pair, newest first", async () => {
    bookingStubs.customerRefs = {
      rows: [
        {
          scheduled_at: new Date("2026-09-14T07:00:00.000Z"),
          booking_id: BOOKING_ID,
        },
        {
          scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
          booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        },
      ],
      pageState: null,
    };
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({
        scheduled_at: new Date("2026-09-14T07:00:00.000Z"),
      }),
      makeBookingRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        scheduled_at: new Date("2026-09-16T10:00:00.000Z"),
      }),
      // Same customer, other mechanic: must be filtered out.
      makeBookingRow({
        booking_id: "cccccccc-3333-4333-8333-cccccccccccc",
        mechanic_id: MECHANIC_OTHER_ID,
      }),
    ];
    const result = await getThreadBookings(customer, THREAD_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.id)).toEqual([
      "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
      BOOKING_ID,
    ]);
    expect(result.data).toHaveLength(2);
  });

  test("caps the strip at three items", async () => {
    bookingStubs.customerRefs = {
      rows: [0, 1, 2, 3, 4].map((index) => ({
        scheduled_at: new Date(`2026-09-${10 + index}T07:00:00.000Z`),
        booking_id: `bbbbbbbb-222${index}-4222-8222-bbbbbbbbbbb${index}`,
      })),
      pageState: null,
    };
    mechanicStubs.bookingRowsByIds = [0, 1, 2, 3, 4].map((index) =>
      makeBookingRow({
        booking_id: `bbbbbbbb-222${index}-4222-8222-bbbbbbbbbbb${index}`,
        scheduled_at: new Date(`2026-09-${10 + index}T07:00:00.000Z`),
      }),
    );
    const result = await getThreadBookings(customer, THREAD_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(3);
  });

  test("empty refs resolve to an empty strip", async () => {
    const result = await getThreadBookings(customer, THREAD_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([]);
    expect(
      mechanicBookingsRepoMocks.listBookingRowsByIds,
    ).not.toHaveBeenCalled();
  });

  test("non-members get 404 and touch no booking tables", async () => {
    const result = await getThreadBookings(outsider, THREAD_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(
      mechanicBookingsRepoMocks.listBookingRowsByIds,
    ).not.toHaveBeenCalled();
  });
});
