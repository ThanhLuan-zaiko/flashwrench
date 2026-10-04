import { beforeEach, describe, expect, mock, test } from "bun:test";
import { types } from "cassandra-driver";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { makeServiceRow } from "../helpers/catalog.fixtures";
import { resetDbFake, scyllaMocks, scyllaStub } from "../helpers/db-fake";

let rows: Record<string, unknown>[] = [];
mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));

import {
  findServiceRowById,
  listServiceRows,
  listServiceRowsByCategory,
} from "@/lib/catalog/services.repository";

beforeEach(() => {
  rows = [{ ...makeServiceRow(), base_price: types.Long.fromNumber(700000) }];
  resetDbFake();
  scyllaMocks.execute.mockImplementation(async () => ({
    rows,
    first: () => rows[0] ?? null,
  }));
});

describe("service catalog BIGINT price boundaries", () => {
  test("normalizes prices from Cassandra Long before booking validation", async () => {
    const row = await findServiceRowById(String(rows[0]?.service_id));
    expect(row?.base_price).toBe(700000);
    expect(Number.isSafeInteger(row?.base_price)).toBe(true);
  });

  test("normalizes both public catalog and category index prices", async () => {
    const catalog = await listServiceRows();
    const category = await listServiceRowsByCategory(
      String(rows[0]?.category_id),
    );
    expect(catalog[0]?.base_price).toBe(700000);
    expect(category[0]?.base_price).toBe(700000);
  });

  test("adds numeric bundle prices rather than concatenating serialized Long values", async () => {
    rows.push({
      ...makeServiceRow({ service_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }),
      base_price: types.Long.fromNumber(300000),
    });
    const catalog = await listServiceRows();
    const services = catalog.map((row) => ({
      id: row.service_id,
      categoryId: row.category_id ?? "",
      categoryName: row.category_name ?? "",
      name: row.name ?? "",
      slug: row.slug ?? "",
      imageUrl: "",
      images: [],
      description: "",
      basePrice: row.base_price ?? 0,
      priceUnit: "per_job" as const,
      durationMin: row.duration_min ?? 60,
      isHomeSupported: true,
      isEmergencySupported: false,
      isActive: true,
      isDeleted: false,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    }));
    const selection = getBookingServiceSelection(
      services.map((service) => service.id),
      services,
    );
    expect(selection.subtotal).toBe(1000000);
    expect(selection.issue).toBeNull();
  });

  test("preserves null and explicitly free service prices", async () => {
    for (const price of [null, types.Long.ZERO]) {
      rows[0] = { ...makeServiceRow(), base_price: price };
      const row = await findServiceRowById(String(rows[0]?.service_id));
      expect(row?.base_price).toBe(price === null ? null : 0);
    }
  });
});
