import { scylla } from "@/lib/db/client";

// Status/stock/delete writes for the parts domain. Kept apart from
// parts.repository.ts (reads + create/update) so both stay under the
// 350-line limit and each file does one thing.

export async function setPartActive(
  partId: string,
  categoryId: string,
  createdAt: Date | null,
  isActive: boolean,
  updatedAt: Date,
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE parts_by_id SET is_active = ?, updated_at = ? WHERE part_id = ?",
      params: [isActive, updatedAt, partId],
    },
  ];
  if (categoryId && createdAt) {
    statements.push({
      query:
        "UPDATE parts_by_category SET is_active = ? WHERE category_id = ? AND created_at = ? AND part_id = ?",
      params: [isActive, categoryId, createdAt, partId],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

export async function setPartDeleted(
  partId: string,
  categoryId: string,
  createdAt: Date | null,
  brand: string,
  isDeleted: boolean,
  deletedAt: Date | null,
  updatedAt: Date,
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE parts_by_id SET is_deleted = ?, deleted_at = ?, updated_at = ? WHERE part_id = ?",
      params: [isDeleted, deletedAt, updatedAt, partId],
    },
  ];
  if (categoryId && createdAt) {
    statements.push({
      query:
        "UPDATE parts_by_category SET is_deleted = ? WHERE category_id = ? AND created_at = ? AND part_id = ?",
      params: [isDeleted, categoryId, createdAt, partId],
    });
  }
  if (brand && createdAt) {
    statements.push({
      query:
        "UPDATE parts_by_brand SET is_deleted = ? WHERE brand = ? AND created_at = ? AND part_id = ?",
      params: [isDeleted, brand, createdAt, partId],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

// Absolute stock write for staff adjustments. Mirrors the new value into
// the category read model so listings stay consistent.
export async function setPartStock(
  partId: string,
  categoryId: string,
  createdAt: Date | null,
  stockQty: number,
  updatedAt: Date,
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE parts_by_id SET stock_qty = ?, updated_at = ? WHERE part_id = ?",
      params: [stockQty, updatedAt, partId],
    },
  ];
  if (categoryId && createdAt) {
    statements.push({
      query:
        "UPDATE parts_by_category SET stock_qty = ? WHERE category_id = ? AND created_at = ? AND part_id = ?",
      params: [stockQty, categoryId, createdAt, partId],
    });
  }
  await scylla.batch(statements, { prepare: true });
}

// Compare-and-set stock decrement for checkout: applies only when the row
// still holds the value the caller read, so concurrent orders cannot
// oversell. The caller retries with a fresh read when this returns false.
export async function decrementPartStockCas(
  partId: string,
  expectedQty: number,
  newQty: number,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE parts_by_id SET stock_qty = ? WHERE part_id = ? IF stock_qty = ?",
    [newQty, partId, expectedQty],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function setPartSoldCount(
  partId: string,
  soldCount: number,
): Promise<void> {
  await scylla.execute(
    "UPDATE parts_by_id SET sold_count = ? WHERE part_id = ?",
    [soldCount, partId],
    { prepare: true },
  );
}

export async function hardDeletePart(params: {
  partId: string;
  slug: string;
  sku: string;
  categoryId: string;
  brand: string;
  createdAt: Date | null;
}): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query: "DELETE FROM parts_by_id WHERE part_id = ?",
      params: [params.partId],
    },
    {
      query: "DELETE FROM parts_by_slug WHERE slug = ?",
      params: [params.slug],
    },
    {
      query: "DELETE FROM parts_by_sku WHERE sku = ?",
      params: [params.sku],
    },
  ];
  if (params.categoryId && params.createdAt) {
    statements.push({
      query:
        "DELETE FROM parts_by_category WHERE category_id = ? AND created_at = ? AND part_id = ?",
      params: [params.categoryId, params.createdAt, params.partId],
    });
  }
  if (params.brand && params.createdAt) {
    statements.push({
      query:
        "DELETE FROM parts_by_brand WHERE brand = ? AND created_at = ? AND part_id = ?",
      params: [params.brand, params.createdAt, params.partId],
    });
  }
  await scylla.batch(statements, { prepare: true });
}
