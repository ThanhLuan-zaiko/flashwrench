import { scylla } from "@/lib/db/client";
import type { PartCategoryRow } from "./parts.types";

const CATEGORY_COLUMNS =
  "category_id, name, slug, icon, description, sort_order, is_active, is_deleted, created_at, updated_at, deleted_at";

function toCategoryRow(row: Record<string, unknown>): PartCategoryRow {
  return {
    category_id: String(row.category_id),
    name: (row.name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    sort_order: (row.sort_order as number | null) ?? null,
    is_active: (row.is_active as boolean | null) ?? null,
    is_deleted: (row.is_deleted as boolean | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
    deleted_at: (row.deleted_at as Date | null) ?? null,
  };
}

// Config tables are tiny (< 100 rows), so a full-table scan is
// intentional here. No ALLOW FILTERING is needed for primary-key reads.
export async function listPartCategoryRows(): Promise<PartCategoryRow[]> {
  const result = await scylla.execute(
    `SELECT ${CATEGORY_COLUMNS} FROM part_categories`,
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toCategoryRow(r as unknown as Record<string, unknown>),
  );
}

export async function findPartCategoryRowById(
  categoryId: string,
): Promise<PartCategoryRow | null> {
  const result = await scylla.execute(
    `SELECT ${CATEGORY_COLUMNS} FROM part_categories WHERE category_id = ?`,
    [categoryId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toCategoryRow(row) : null;
}

export async function findPartCategoryIdBySlug(
  slug: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT category_id FROM part_categories_by_slug WHERE slug = ?",
    [slug],
    { prepare: true },
  );
  const row = result.first() as unknown as { category_id?: unknown } | null;
  return row?.category_id ? String(row.category_id) : null;
}

export type InsertPartCategoryParams = {
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  now: Date;
};

export async function insertPartCategory(
  params: InsertPartCategoryParams,
): Promise<void> {
  // Main row only. The slug pointer is claimed separately with
  // claimPartCategorySlug (IF NOT EXISTS) so concurrent creates with the
  // same slug cannot silently overwrite each other.
  await scylla.execute(
    "INSERT INTO part_categories (category_id, name, slug, icon, description, sort_order, is_active, is_deleted, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?, null)",
    [
      params.categoryId,
      params.name,
      params.slug,
      params.icon,
      params.description,
      params.sortOrder,
      params.isActive,
      params.now,
      params.now,
    ],
    { prepare: true },
  );
}

export async function claimPartCategorySlug(
  slug: string,
  categoryId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO part_categories_by_slug (slug, category_id) VALUES (?, ?) IF NOT EXISTS",
    [slug, categoryId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releasePartCategorySlug(
  slug: string,
  categoryId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM part_categories_by_slug WHERE slug = ? IF category_id = ?",
    [slug, categoryId],
    { prepare: true },
  );
  return result.wasApplied();
}

export type UpdatePartCategoryParams = {
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

export async function updatePartCategoryRow(
  params: UpdatePartCategoryParams,
): Promise<void> {
  await scylla.execute(
    "UPDATE part_categories SET name = ?, slug = ?, icon = ?, description = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE category_id = ?",
    [
      params.name,
      params.slug,
      params.icon,
      params.description,
      params.sortOrder,
      params.isActive,
      params.updatedAt,
      params.categoryId,
    ],
    { prepare: true },
  );
}

export async function setPartCategoryActive(
  categoryId: string,
  isActive: boolean,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE part_categories SET is_active = ?, updated_at = ? WHERE category_id = ?",
    [isActive, updatedAt, categoryId],
    { prepare: true },
  );
}

export async function setPartCategoryDeleted(
  categoryId: string,
  isDeleted: boolean,
  deletedAt: Date | null,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE part_categories SET is_deleted = ?, deleted_at = ?, updated_at = ? WHERE category_id = ?",
    [isDeleted, deletedAt, updatedAt, categoryId],
    { prepare: true },
  );
}

export async function hardDeletePartCategory(
  categoryId: string,
  slug: string,
): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM part_categories WHERE category_id = ?",
        params: [categoryId],
      },
      {
        query: "DELETE FROM part_categories_by_slug WHERE slug = ?",
        params: [slug],
      },
    ],
    { prepare: true },
  );
}
