import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ResolvedWorkflowWrite } from "@/lib/booking/booking-workflow.repository";
import {
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";

const executeCalls: { query: string; params: unknown[] }[] = [];
const batchCalls: {
  queries: { query: string; params: unknown[] }[];
  options: { prepare?: boolean; timestamp?: { toString(): string } };
}[] = [];
let applied = true;

const scyllaStub = {
  execute: mock(async (query: string, params: unknown[]): Promise<unknown> => {
    executeCalls.push({ query, params });
    return {
      first: () => (applied ? { "[applied]": true } : { "[applied]": false }),
      rows: [],
    };
  }),
  batch: mock(
    async (
      queries: { query: string; params: unknown[] }[],
      options?: { prepare?: boolean; timestamp?: { toString(): string } },
    ): Promise<void> => {
      batchCalls.push({ queries, options: options ?? {} });
    },
  ),
};

mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import {
  claimBookingTransition,
  projectBookingTransition,
} from "@/lib/booking/booking-workflow.repository";

function makeWrite(
  overrides?: Partial<ResolvedWorkflowWrite>,
): ResolvedWorkflowWrite {
  return {
    before: makeBookingRow({ status: "pending" }),
    status: "mechanic_assigned",
    mechanicId: MECHANIC_ID,
    mechanicName: "Nguyen Van A",
    actorId: CUSTOMER_ID,
    note: null,
    at: new Date("2026-09-16T08:00:00.000Z"),
    monthBucket: "2026-09",
    ...overrides,
  };
}

beforeEach(() => {
  executeCalls.length = 0;
  batchCalls.length = 0;
  applied = true;
  scyllaStub.execute.mockClear();
  scyllaStub.batch.mockClear();
});

describe("claimBookingTransition", () => {
  test("runs the canonical CAS guarded by status, mechanic and updated_at", async () => {
    const write = makeWrite();
    const result = await claimBookingTransition(write);

    expect(result).toBe(true);
    expect(executeCalls).toHaveLength(1);
    const call = executeCalls[0];
    expect(call.query).toContain("UPDATE bookings_by_id");
    expect(call.query).toContain(
      "IF status = ? AND mechanic_id = ? AND updated_at = ?",
    );
    expect(call.params.slice(-4)).toEqual([
      write.before.booking_id,
      write.before.status,
      write.before.mechanic_id,
      write.before.updated_at,
    ]);
    expect(call.params[4]).toBe(write.at);
  });

  test("returns false when the CAS loses", async () => {
    applied = false;
    expect(await claimBookingTransition(makeWrite())).toBe(false);
  });
});

describe("projectBookingTransition", () => {
  test("uses the transition timestamp for the whole projection batch", async () => {
    const write = makeWrite({ at: new Date("2026-09-16T09:30:00.000Z") });
    await projectBookingTransition(write);

    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0]?.options.prepare).toBe(true);
    expect(batchCalls[0]?.options.timestamp?.toString()).toBe(
      String(write.at.getTime() * 1000),
    );
    const queries = batchCalls[0]?.queries.map((q) => q.query) ?? [];
    expect(queries.some((q) => q.includes("bookings_by_customer"))).toBe(true);
    expect(queries.some((q) => q.includes("bookings_by_status"))).toBe(true);
    expect(queries.some((q) => q.includes("bookings_by_mechanic"))).toBe(true);
    expect(queries.some((q) => q.includes("booking_status_history"))).toBe(
      true,
    );
  });

  test("never deletes and inserts the same status clustering key", async () => {
    const write = makeWrite();
    await projectBookingTransition(write);

    const queries = batchCalls[0]?.queries ?? [];
    const statusDeletes = queries.filter((q) =>
      q.query.includes("DELETE FROM bookings_by_status"),
    );
    const statusInserts = queries.filter((q) =>
      q.query.includes("INSERT INTO bookings_by_status"),
    );
    for (const del of statusDeletes) {
      for (const ins of statusInserts) {
        expect(del.params.slice(0, 4)).not.toEqual(ins.params.slice(0, 4));
      }
    }
  });

  test("clears the old mechanic index on reassignment", async () => {
    const write = makeWrite({
      before: makeBookingRow({
        status: "pending",
        mechanic_id: MECHANIC_OTHER_ID,
      }),
      status: "confirmed",
      mechanicId: MECHANIC_ID,
    });
    await projectBookingTransition(write);

    const queries = batchCalls[0]?.queries ?? [];
    const mechanicDelete = queries.find((q) =>
      q.query.includes("DELETE FROM bookings_by_mechanic"),
    );
    expect(mechanicDelete?.params).toEqual([
      MECHANIC_OTHER_ID,
      write.before.scheduled_at,
      write.before.booking_id,
    ]);
    const mechanicInsert = queries.find((q) =>
      q.query.includes("INSERT INTO bookings_by_mechanic"),
    );
    expect(mechanicInsert?.params[0]).toBe(MECHANIC_ID);
  });

  test("skips the old-mechanic delete when assignment is unchanged", async () => {
    const write = makeWrite({
      before: makeBookingRow({
        status: "mechanic_assigned",
        mechanic_id: MECHANIC_ID,
      }),
      status: "confirmed",
      mechanicId: MECHANIC_ID,
    });
    await projectBookingTransition(write);

    const queries = batchCalls[0]?.queries ?? [];
    expect(
      queries.filter((q) =>
        q.query.includes("DELETE FROM bookings_by_mechanic"),
      ),
    ).toHaveLength(0);
  });
});
