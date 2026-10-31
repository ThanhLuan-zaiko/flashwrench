import { beforeEach, describe, expect, mock, test } from "bun:test";

// Regression for lost stock updates on order cancel: restockForOrder used a
// blind write (stock = read + qty), so a checkout that decremented the same
// part between the read and the write was overwritten and the shelf showed
// stock that did not exist. The restock is now a compare-and-set on the value
// it read, with a bounded re-read, like the checkout decrement.
// This suite runs the REAL lifecycle service and inventory repository against
// a scylla fake that evaluates the IF condition the way the server does.

type Statement = { query: string; params: unknown[] };
type Result = {
  first: () => Record<string, unknown> | null;
  rows: unknown[];
  wasApplied: () => boolean;
};

const PART_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CATEGORY_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CREATED_AT = new Date("2026-09-01T00:00:00.000Z");

const state = {
  stock: 8,
  soldCount: 5,
  // Each entry runs right before a conditional stock write lands, standing
  // in for a checkout that committed in between our read and our write.
  interleave: [] as Array<() => void>,
  conditionalAttempts: 0,
  categoryWrites: [] as Statement[],
};

function row(value: Record<string, unknown> | null): Result {
  return {
    first: () => value,
    rows: value ? [value] : [],
    wasApplied: () => true,
  };
}

function partRow(): Record<string, unknown> {
  return {
    part_id: PART_ID,
    sku: "BG-NGK-01",
    name: "Bugi tiêu chuẩn",
    slug: "bugi-tieu-chuan",
    brand: "NGK",
    category_id: CATEGORY_ID,
    category_name: "Bugi",
    car_brands: null,
    car_models: null,
    price: 90000,
    compare_price: null,
    stock_qty: state.stock,
    sold_count: state.soldCount,
    images: null,
    specs: null,
    description: null,
    rating_avg: null,
    rating_count: null,
    is_active: true,
    is_deleted: false,
    created_at: CREATED_AT,
    updated_at: null,
    deleted_at: null,
  };
}

const scyllaStub = {
  execute: mock(
    async (query: string, params: unknown[] = []): Promise<Result> => {
      const q = query.replace(/\s+/g, " ");
      if (q.includes("FROM parts_by_id WHERE part_id")) return row(partRow());
      if (
        q.startsWith("UPDATE parts_by_id SET stock_qty = ?, updated_at = ?")
      ) {
        state.conditionalAttempts += 1;
        state.interleave.shift()?.();
        const [newQty, , , expectedQty] = params as [
          number,
          Date,
          string,
          number,
        ];
        if (state.stock !== expectedQty) {
          return { ...row({ "[applied]": false }), wasApplied: () => false };
        }
        state.stock = newQty;
        return { ...row({ "[applied]": true }), wasApplied: () => true };
      }
      if (q.startsWith("UPDATE parts_by_id SET sold_count = ?")) {
        state.soldCount = params[0] as number;
        return row(null);
      }
      if (q.startsWith("UPDATE parts_by_category")) {
        state.categoryWrites.push({ query: q, params });
        return row(null);
      }
      return row(null);
    },
  ),
  batch: mock(async (_statements: Statement[]): Promise<void> => undefined),
};

mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import { restockForOrder } from "@/lib/parts/parts-lifecycle.service";

// A checkout that sold `qty` units between our read and our write.
function concurrentSale(qty: number): () => void {
  return () => {
    state.stock -= qty;
  };
}

beforeEach(() => {
  state.stock = 8;
  state.soldCount = 5;
  state.interleave = [];
  state.conditionalAttempts = 0;
  state.categoryWrites = [];
  scyllaStub.execute.mockClear();
});

describe("order cancel restock", () => {
  test("keeps a sale that committed between the read and the restock", async () => {
    // Read 8, a sale takes 2 (stock 6), then the restock of 2 lands.
    state.interleave = [concurrentSale(2)];

    await restockForOrder(PART_ID, 2);

    // Stock is 6 after the sale, plus the 2 units coming back.
    expect(state.stock).toBe(8);
    expect(state.conditionalAttempts).toBe(2);
    expect(state.soldCount).toBe(3);
  });

  test("restocks in one conditional write when nothing interleaves", async () => {
    await restockForOrder(PART_ID, 2);

    expect(state.stock).toBe(10);
    expect(state.conditionalAttempts).toBe(1);
    expect(state.soldCount).toBe(3);
  });

  test("the category read model follows the applied restock", async () => {
    await restockForOrder(PART_ID, 2);

    expect(state.categoryWrites).toHaveLength(1);
    expect(state.categoryWrites[0].params).toEqual([
      10,
      CATEGORY_ID,
      CREATED_AT,
      PART_ID,
    ]);
  });

  test("fails loudly when every attempt loses instead of dropping the units", async () => {
    // A sale lands before each of the three attempts.
    state.interleave = [
      concurrentSale(1),
      concurrentSale(1),
      concurrentSale(1),
    ];

    await expect(restockForOrder(PART_ID, 2)).rejects.toThrow(
      `Restock lost the stock claim for part ${PART_ID}`,
    );
    // Only the three sales changed the shelf; the restock wrote nothing.
    expect(state.stock).toBe(5);
    expect(state.conditionalAttempts).toBe(3);
    expect(state.categoryWrites).toHaveLength(0);
  });
});
