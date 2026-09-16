import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makePaymentRow,
  makeProfileRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);

import { getMechanicIncome } from "@/lib/mechanic/mechanic-income.service";

const REFERENCE = new Date("2026-09-16T10:00:00.000Z");

beforeEach(() => {
  resetMechanicMocks();
});

describe("getMechanicIncome", () => {
  test("splits paid, pending and refunded entries with a VN-day summary", async () => {
    mechanicStubs.workloadRows = [
      // Completed today, paid today -> counts for today/week/month.
      makeWorkloadRow({ status: "completed" }),
      // Completed last month, paid -> counts for lifetime only.
      makeWorkloadRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        customer_name: "Tran Thi Binh",
        vehicle_plate: "29C-67890",
        scheduled_at: new Date("2026-08-10T07:00:00.000Z"),
        status: "completed",
        total: 520000,
      }),
      // Completed but unpaid -> pending total only.
      makeWorkloadRow({
        booking_id: "cccccccc-3333-4333-8333-cccccccccccc",
        customer_name: "Le Van Cuong",
        vehicle_plate: "29B-33445",
        scheduled_at: new Date("2026-09-14T07:00:00.000Z"),
        status: "completed",
        total: 380000,
      }),
      // Cancelled after a refund -> refunded entry.
      makeWorkloadRow({
        booking_id: "dddddddd-4444-4444-8444-dddddddddddd",
        customer_name: "Pham Thi Dung",
        vehicle_plate: "51C-99887",
        scheduled_at: new Date("2026-09-13T07:00:00.000Z"),
        status: "cancelled",
        total: 290000,
      }),
      // Pending booking is not a transaction at all.
      makeWorkloadRow({
        booking_id: "eeeeeeee-5555-4555-8555-eeeeeeeeeeee",
        status: "pending",
        total: 600000,
      }),
    ];
    mechanicStubs.paymentRows = [
      makePaymentRow({
        paid_at: new Date("2026-09-16T09:30:00.000Z"),
        created_at: new Date("2026-09-16T09:30:00.000Z"),
      }),
      makePaymentRow({
        ref_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        amount: 520000,
        paid_at: new Date("2026-08-10T09:30:00.000Z"),
        created_at: new Date("2026-08-10T09:30:00.000Z"),
        payment_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
      makePaymentRow({
        ref_id: "dddddddd-4444-4444-8444-dddddddddddd",
        amount: 290000,
        status: "refunded",
        paid_at: null,
        created_at: new Date("2026-09-13T09:30:00.000Z"),
        payment_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
    ];

    const result = await getMechanicIncome(MECHANIC_ID, { now: REFERENCE });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries.map((entry) => entry.state)).toEqual([
      "paid",
      "pending",
      "paid",
      "refunded",
    ]);
    expect(result.data.summary).toMatchObject({
      today: 450000,
      week: 450000,
      month: 450000,
      lifetime: 970000,
      pendingTotal: 380000,
      paidCount: 2,
      pendingCount: 1,
    });
    expect(result.data.truncated).toBe(false);
    expect(
      mechanicWorkspaceRepoMocks.listPaymentRowsByRefIds.mock.calls[0],
    ).toEqual([
      "booking",
      [
        BOOKING_ID,
        "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        "cccccccc-3333-4333-8333-cccccccccccc",
        "dddddddd-4444-4444-8444-dddddddddddd",
      ],
    ]);
  });

  test("returns an empty summary when nothing is billable", async () => {
    mechanicStubs.workloadRows = [makeWorkloadRow({ status: "pending" })];
    mechanicStubs.paymentRows = [];
    mechanicStubs.profile = makeProfileRow();

    const result = await getMechanicIncome(MECHANIC_ID, { now: REFERENCE });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries).toEqual([]);
    expect(result.data.summary).toMatchObject({
      lifetime: 0,
      pendingTotal: 0,
      paidCount: 0,
      pendingCount: 0,
    });
  });
});
