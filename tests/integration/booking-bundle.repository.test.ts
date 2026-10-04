import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeBookingInsert,
  makeBookingServiceSnapshot,
} from "../helpers/booking.fixtures";

import { resetDbFake, scyllaMocks, scyllaStub } from "../helpers/db-fake";

const batch = scyllaMocks.batch;
mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import { insertCustomerBooking } from "@/lib/booking/booking.repository";

beforeEach(resetDbFake);

describe("multi-service booking persistence", () => {
  test("writes every item and every projection in one prepared batch", async () => {
    const items = [
      makeBookingServiceSnapshot(),
      makeBookingServiceSnapshot({
        serviceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        serviceName: "Kiểm tra phanh",
        unitPrice: 101000,
        lineTotal: 101000,
        durationMin: 120,
      }),
    ];
    await insertCustomerBooking(
      makeBookingInsert({
        items,
        subtotal: 300000,
        total: 300000,
        durationMin: 180,
      }),
    );
    expect(batch).toHaveBeenCalledTimes(1);
    const [queries, options] = batch.mock.calls[0];
    expect(options).toEqual({ prepare: true });
    const lines = queries.filter((entry) =>
      entry.query.includes("INSERT INTO booking_items"),
    );
    expect(lines).toHaveLength(2);
    for (const [index, line] of lines.entries()) {
      expect(line.params).toContain(items[index].serviceId);
      expect(line.params).toContain(items[index].durationMin);
      expect(line.params).toContain(items[index].priceUnit);
    }
    const canonical = queries.find((entry) =>
      entry.query.includes("INSERT INTO bookings_by_id"),
    );
    expect(canonical?.query).toContain("duration_min");
    expect(canonical?.params).toContain(180);
    expect(
      queries.filter((entry) =>
        entry.query.includes("INSERT INTO booking_status_history"),
      ),
    ).toHaveLength(1);
    expect(
      queries.filter((entry) =>
        entry.query.includes("INSERT INTO bookings_by_customer"),
      ),
    ).toHaveLength(1);
    for (const entry of queries) {
      expect(entry.query.match(/\?/g)?.length).toBe(entry.params.length);
    }
  });

  test("keeps guests out of the account history while retaining all items", async () => {
    await insertCustomerBooking(makeBookingInsert({ customerId: null }));
    const queries = batch.mock.calls[0][0];
    expect(
      queries.some((entry) =>
        entry.query.includes("INSERT INTO bookings_by_customer"),
      ),
    ).toBe(false);
    expect(
      queries.some((entry) =>
        entry.query.includes("INSERT INTO guest_bookings_by_phone"),
      ),
    ).toBe(true);
    expect(
      queries.some((entry) =>
        entry.query.includes("INSERT INTO booking_items"),
      ),
    ).toBe(true);
  });
});
