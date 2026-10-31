import { beforeEach, describe, expect, mock, test } from "bun:test";

// Regression for lost order status moves: the by-id status write was an
// unconditional UPDATE, so a staff move and a customer cancel that both read
// the same pending order both "applied". The later write silently won, which
// left a cancelled order confirmed after its wallet and stock were already
// given back. The by-id row is now the claim (UPDATE ... IF status = ?).
// This suite runs the REAL repository against a scylla fake that evaluates
// the IF condition the way the server does.

type Statement = { query: string; params: unknown[] };
type Result = {
  first: () => Record<string, unknown> | null;
  rows: unknown[];
  wasApplied: () => boolean;
};

const state = {
  statusByOrderId: new Map<string, string>(),
  batches: [] as Statement[][],
};

function conditional(applied: boolean): Result {
  return {
    first: () => ({ "[applied]": applied }),
    rows: [],
    wasApplied: () => applied,
  };
}

const scyllaStub = {
  execute: mock(
    async (query: string, params: unknown[] = []): Promise<Result> => {
      const q = query.replace(/\s+/g, " ");
      if (q.startsWith("UPDATE orders_by_id") && q.endsWith(" IF status = ?")) {
        const [newStatus, , orderId, expectedStatus] = params as [
          string,
          Date,
          string,
          string,
        ];
        if (state.statusByOrderId.get(orderId) !== expectedStatus) {
          return conditional(false);
        }
        state.statusByOrderId.set(orderId, newStatus);
        return conditional(true);
      }
      return conditional(true);
    },
  ),
  batch: mock(async (statements: Statement[]): Promise<void> => {
    state.batches.push(statements);
  }),
};

mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import { updateOrderStatusRows } from "@/lib/orders/orders-write.repository";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const CREATED_AT = new Date("2026-10-01T00:00:00.000Z");

function move(oldStatus: string, newStatus: string) {
  return updateOrderStatusRows({
    orderId: ORDER_ID,
    customerId: CUSTOMER_ID,
    oldStatus,
    newStatus,
    monthBucket: "2026-10",
    createdAt: CREATED_AT,
    total: 270000,
    now: new Date("2026-10-02T00:00:00.000Z"),
  });
}

beforeEach(() => {
  state.statusByOrderId = new Map([[ORDER_ID, "pending"]]);
  state.batches = [];
  scyllaStub.execute.mockClear();
  scyllaStub.batch.mockClear();
});

describe("order status claim", () => {
  test("a move that read a stale status loses and writes no buckets", async () => {
    // Both the staff move and the customer cancel read "pending" first.
    const staffApplied = await move("pending", "confirmed");
    const customerApplied = await move("pending", "cancelled");

    expect(staffApplied).toBe(true);
    expect(customerApplied).toBe(false);
    expect(state.statusByOrderId.get(ORDER_ID)).toBe("confirmed");
    // Only the winning move projected its (status, month) buckets.
    expect(state.batches).toHaveLength(1);
    const projected = state.batches[0].flatMap((s) => s.params);
    expect(projected).not.toContain("cancelled");
  });

  test("a move from the current status applies and moves every bucket", async () => {
    const applied = await move("pending", "confirmed");

    expect(applied).toBe(true);
    expect(state.statusByOrderId.get(ORDER_ID)).toBe("confirmed");
    const queries = state.batches[0].map((s) => s.query);
    expect(
      queries.some((q) => q.startsWith("DELETE FROM orders_by_status")),
    ).toBe(true);
    expect(
      queries.some((q) => q.startsWith("INSERT INTO orders_by_status")),
    ).toBe(true);
    expect(queries.some((q) => q.startsWith("UPDATE orders_by_customer"))).toBe(
      true,
    );
  });

  test("a second move from the same stale status never reapplies", async () => {
    await move("pending", "cancelled");
    const again = await move("pending", "cancelled");

    expect(again).toBe(false);
    expect(state.statusByOrderId.get(ORDER_ID)).toBe("cancelled");
    expect(state.batches).toHaveLength(1);
  });
});
