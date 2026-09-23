import { scylla } from "@/lib/db/client";
import type { PartRow } from "./parts.types";

const PART_COLUMNS =
  "part_id, sku, name, slug, brand, category_id, category_name, car_brands, car_models, price, compare_price, stock_qty, sold_count, images, specs, description, rating_avg, rating_count, is_active, is_deleted, created_at, updated_at, deleted_at";

export function toPartRow(row: Record<string, unknown>): PartRow {
  return {
    part_id: String(row.part_id),
    sku: (row.sku as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    brand: (row.brand as string | null) ?? null,
    category_id: row.category_id ? String(row.category_id) : null,
    category_name: (row.category_name as string | null) ?? null,
    car_brands: (row.car_brands as string[] | null) ?? null,
    car_models: (row.car_models as string[] | null) ?? null,
    price: (row.price as number | null) ?? null,
    compare_price: (row.compare_price as number | null) ?? null,
    stock_qty: (row.stock_qty as number | null) ?? null,
    sold_count: (row.sold_count as number | null) ?? null,
    images: (row.images as string[] | null) ?? null,
    specs: (row.specs as Record<string, string> | null) ?? null,
    description: (row.description as string | null) ?? null,
    rating_avg: (row.rating_avg as number | null) ?? null,
    rating_count: (row.rating_count as number | null) ?? null,
    is_active: (row.is_active as boolean | null) ?? null,
    is_deleted: (row.is_deleted as boolean | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
    deleted_at: (row.deleted_at as Date | null) ?? null,
  };
}

// Dev-scale catalog: the parts list is small enough that a full scan is
// intentional here (same approach as the service catalog). Category and
// brand read models stay maintained for the per-partition queries.
export async function listPartRows(): Promise<PartRow[]> {
  const result = await scylla.execute(
    `SELECT ${PART_COLUMNS} FROM parts_by_id`,
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toPartRow(r as unknown as Record<string, unknown>),
  );
}

export async function findPartRowById(partId: string): Promise<PartRow | null> {
  const result = await scylla.execute(
    `SELECT ${PART_COLUMNS} FROM parts_by_id WHERE part_id = ?`,
    [partId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toPartRow(row) : null;
}

export async function findPartIdBySlug(slug: string): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT part_id FROM parts_by_slug WHERE slug = ?",
    [slug],
    { prepare: true },
  );
  const row = result.first() as unknown as { part_id?: unknown } | null;
  return row?.part_id ? String(row.part_id) : null;
}

export async function findPartIdBySku(sku: string): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT part_id FROM parts_by_sku WHERE sku = ?",
    [sku],
    { prepare: true },
  );
  const row = result.first() as unknown as { part_id?: unknown } | null;
  return row?.part_id ? String(row.part_id) : null;
}

export async function claimPartSlug(
  slug: string,
  partId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO parts_by_slug (slug, part_id) VALUES (?, ?) IF NOT EXISTS",
    [slug, partId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releasePartSlug(
  slug: string,
  partId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM parts_by_slug WHERE slug = ? IF part_id = ?",
    [slug, partId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function claimPartSku(
  sku: string,
  partId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO parts_by_sku (sku, part_id) VALUES (?, ?) IF NOT EXISTS",
    [sku, partId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releasePartSku(
  sku: string,
  partId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM parts_by_sku WHERE sku = ? IF part_id = ?",
    [sku, partId],
    { prepare: true },
  );
  return result.wasApplied();
}

export type PartWriteParams = {
  partId: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  carBrands: string[];
  carModels: string[];
  price: number;
  comparePrice: number;
  stockQty: number;
  images: string[];
  specs: Record<string, string>;
  description: string;
  isActive: boolean;
};

export function categoryRowStatement(p: PartWriteParams, createdAt: Date) {
  return {
    query:
      "INSERT INTO parts_by_category (category_id, created_at, part_id, name, slug, brand, image, price, stock_qty, rating_avg, is_active, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, false)",
    params: [
      p.categoryId,
      createdAt,
      p.partId,
      p.name,
      p.slug,
      p.brand,
      p.images[0] ?? "",
      p.price,
      p.stockQty,
      p.isActive,
    ],
  };
}

export function brandRowStatement(
  p: PartWriteParams,
  createdAt: Date,
): { query: string; params: unknown[] } | null {
  if (!p.brand) return null;
  return {
    query:
      "INSERT INTO parts_by_brand (brand, created_at, part_id, name, slug, price, stock_qty, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, false)",
    params: [p.brand, createdAt, p.partId, p.name, p.slug, p.price, p.stockQty],
  };
}

// Insert the main row plus its category/brand read models in one batch.
// Slug and SKU pointers are claimed separately (IF NOT EXISTS) before this.
export async function insertPart(
  params: PartWriteParams & { now: Date },
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO parts_by_id (part_id, sku, name, slug, brand, category_id, category_name, car_brands, car_models, price, compare_price, stock_qty, sold_count, images, specs, description, rating_avg, rating_count, is_active, is_deleted, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, 0, ?, false, ?, ?, null)",
      params: [
        params.partId,
        params.sku,
        params.name,
        params.slug,
        params.brand,
        params.categoryId,
        params.categoryName,
        params.carBrands,
        params.carModels,
        params.price,
        params.comparePrice,
        params.stockQty,
        params.images,
        params.specs,
        params.description,
        params.isActive,
        params.now,
        params.now,
      ],
    },
    categoryRowStatement(params, params.now),
  ];
  const brandStmt = brandRowStatement(params, params.now);
  if (brandStmt) statements.push(brandStmt);
  await scylla.batch(statements, { prepare: true });
}

export type UpdatePartParams = PartWriteParams & {
  updatedAt: Date;
  oldCategoryId: string;
  oldBrand: string;
  createdAt: Date;
};

// Rewrite the main row and keep both read models in sync. The category
// partition changes mean delete+insert (clustering key), same for brand.
export async function updatePartRows(params: UpdatePartParams): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE parts_by_id SET sku = ?, name = ?, slug = ?, brand = ?, category_id = ?, category_name = ?, car_brands = ?, car_models = ?, price = ?, compare_price = ?, stock_qty = ?, images = ?, specs = ?, description = ?, is_active = ?, updated_at = ? WHERE part_id = ?",
      params: [
        params.sku,
        params.name,
        params.slug,
        params.brand,
        params.categoryId,
        params.categoryName,
        params.carBrands,
        params.carModels,
        params.price,
        params.comparePrice,
        params.stockQty,
        params.images,
        params.specs,
        params.description,
        params.isActive,
        params.updatedAt,
        params.partId,
      ],
    },
  ];
  if (params.oldCategoryId && params.oldCategoryId !== params.categoryId) {
    statements.push({
      query:
        "DELETE FROM parts_by_category WHERE category_id = ? AND created_at = ? AND part_id = ?",
      params: [params.oldCategoryId, params.createdAt, params.partId],
    });
  }
  statements.push(categoryRowStatement(params, params.createdAt));
  if (params.oldBrand && params.oldBrand !== params.brand) {
    statements.push({
      query:
        "DELETE FROM parts_by_brand WHERE brand = ? AND created_at = ? AND part_id = ?",
      params: [params.oldBrand, params.createdAt, params.partId],
    });
  }
  const brandStmt = brandRowStatement(params, params.createdAt);
  if (brandStmt) statements.push(brandStmt);
  await scylla.batch(statements, { prepare: true });
}
