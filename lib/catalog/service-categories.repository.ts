import { scylla } from "@/lib/db/client";
import type {
  ServiceCategoryBySlugRow,
  ServiceCategoryRow,
} from "./service-catalog.types";

function toCategoryRow(row: Record<string, unknown>): ServiceCategoryRow {
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
export async function listCategoryRows(): Promise<ServiceCategoryRow[]> {
  const result = await scylla.execute(
    "SELECT category_id, name, slug, icon, description, sort_order, is_active, is_deleted, created_at, updated_at, deleted_at FROM service_categories",
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toCategoryRow(r as unknown as Record<string, unknown>),
  );
}

export async function findCategoryRowById(
  categoryId: string,
): Promise<ServiceCategoryRow | null> {
  const result = await scylla.execute(
    "SELECT category_id, name, slug, icon, description, sort_order, is_active, is_deleted, created_at, updated_at, deleted_at FROM service_categories WHERE category_id = ?",
    [categoryId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toCategoryRow(row) : null;
}

export async function findCategoryIdBySlug(
  slug: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT category_id FROM service_categories_by_slug WHERE slug = ?",
    [slug],
    { prepare: true },
  );
  const row = result.first() as unknown as ServiceCategoryBySlugRow | null;
  return row?.category_id ? String(row.category_id) : null;
}

export type InsertCategoryParams = {
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  now: Date;
};

export async function insertCategory(
  params: InsertCategoryParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO service_categories (category_id, name, slug, icon, description, sort_order, is_active, is_deleted, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?, null)",
        params: [
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
      },
      {
        query:
          "INSERT INTO service_categories_by_slug (slug, category_id) VALUES (?, ?)",
        params: [params.slug, params.categoryId],
      },
    ],
    { prepare: true },
  );
}

export type UpdateCategoryParams = {
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

export async function updateCategoryRow(
  params: UpdateCategoryParams,
): Promise<void> {
  await scylla.execute(
    "UPDATE service_categories SET name = ?, slug = ?, icon = ?, description = ?, sort_order = ?, is_active = ?, updated_at = ? WHERE category_id = ?",
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

export async function moveCategorySlug(
  oldSlug: string,
  newSlug: string,
  categoryId: string,
): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM service_categories_by_slug WHERE slug = ?",
        params: [oldSlug],
      },
      {
        query:
          "INSERT INTO service_categories_by_slug (slug, category_id) VALUES (?, ?)",
        params: [newSlug, categoryId],
      },
    ],
    { prepare: true },
  );
}

export async function setCategoryActive(
  categoryId: string,
  isActive: boolean,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE service_categories SET is_active = ?, updated_at = ? WHERE category_id = ?",
    [isActive, updatedAt, categoryId],
    { prepare: true },
  );
}

export async function setCategoryDeleted(
  categoryId: string,
  isDeleted: boolean,
  deletedAt: Date | null,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE service_categories SET is_deleted = ?, deleted_at = ?, updated_at = ? WHERE category_id = ?",
    [isDeleted, deletedAt, updatedAt, categoryId],
    { prepare: true },
  );
}

export async function hardDeleteCategory(
  categoryId: string,
  slug: string,
): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM service_categories WHERE category_id = ?",
        params: [categoryId],
      },
      {
        query: "DELETE FROM service_categories_by_slug WHERE slug = ?",
        params: [slug],
      },
    ],
    { prepare: true },
  );
}
