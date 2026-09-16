import { scylla } from "@/lib/db/client";
import type {
  ServiceByCategoryRow,
  ServiceBySlugRow,
  ServiceRow,
} from "./service-catalog.types";

function toServiceRow(row: Record<string, unknown>): ServiceRow {
  return {
    service_id: String(row.service_id),
    category_id: row.category_id ? String(row.category_id) : null,
    category_name: (row.category_name as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    base_price: (row.base_price as number | null) ?? null,
    price_unit: (row.price_unit as string | null) ?? null,
    duration_min: (row.duration_min as number | null) ?? null,
    is_home_supported: (row.is_home_supported as boolean | null) ?? null,
    is_emergency_supported:
      (row.is_emergency_supported as boolean | null) ?? null,
    is_active: (row.is_active as boolean | null) ?? null,
    is_deleted: (row.is_deleted as boolean | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
    deleted_at: (row.deleted_at as Date | null) ?? null,
  };
}

function toByCategoryRow(row: Record<string, unknown>): ServiceByCategoryRow {
  return {
    category_id: String(row.category_id),
    service_id: String(row.service_id),
    name: (row.name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    base_price: (row.base_price as number | null) ?? null,
    duration_min: (row.duration_min as number | null) ?? null,
    is_active: (row.is_active as boolean | null) ?? null,
    is_deleted: (row.is_deleted as boolean | null) ?? null,
  };
}

export async function listServiceRows(): Promise<ServiceRow[]> {
  const result = await scylla.execute(
    "SELECT service_id, category_id, category_name, name, slug, image_url, description, base_price, price_unit, duration_min, is_home_supported, is_emergency_supported, is_active, is_deleted, created_at, updated_at, deleted_at FROM services_by_id",
    [],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toServiceRow(r as unknown as Record<string, unknown>),
  );
}

export async function findServiceRowById(
  serviceId: string,
): Promise<ServiceRow | null> {
  const result = await scylla.execute(
    "SELECT service_id, category_id, category_name, name, slug, image_url, description, base_price, price_unit, duration_min, is_home_supported, is_emergency_supported, is_active, is_deleted, created_at, updated_at, deleted_at FROM services_by_id WHERE service_id = ?",
    [serviceId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toServiceRow(row) : null;
}

export async function findServiceIdBySlug(
  slug: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT service_id FROM services_by_slug WHERE slug = ?",
    [slug],
    {
      prepare: true,
    },
  );
  const row = result.first() as unknown as ServiceBySlugRow | null;
  return row?.service_id ? String(row.service_id) : null;
}

export async function listServiceRowsByCategory(
  categoryId: string,
): Promise<ServiceByCategoryRow[]> {
  const result = await scylla.execute(
    "SELECT category_id, service_id, name, slug, base_price, duration_min, is_active, is_deleted FROM services_by_category WHERE category_id = ?",
    [categoryId],
    { prepare: true },
  );
  return result.rows.map((r) =>
    toByCategoryRow(r as unknown as Record<string, unknown>),
  );
}

export type InsertServiceParams = {
  serviceId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  durationMin: number;
  isHomeSupported: boolean;
  isEmergencySupported: boolean;
  isActive: boolean;
  now: Date;
};

export async function insertService(
  params: InsertServiceParams,
): Promise<void> {
  // Main rows only. The slug pointer is claimed separately with
  // claimServiceSlug (IF NOT EXISTS) so concurrent creates with the
  // same slug cannot silently overwrite each other.
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO services_by_id (service_id, category_id, category_name, name, slug, image_url, description, base_price, price_unit, duration_min, is_home_supported, is_emergency_supported, is_active, is_deleted, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?, ?, null)",
        params: [
          params.serviceId,
          params.categoryId,
          params.categoryName,
          params.name,
          params.slug,
          params.imageUrl,
          params.description,
          params.basePrice,
          params.priceUnit,
          params.durationMin,
          params.isHomeSupported,
          params.isEmergencySupported,
          params.isActive,
          params.now,
          params.now,
        ],
      },
      {
        query:
          "INSERT INTO services_by_category (category_id, service_id, name, slug, base_price, duration_min, is_active, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, false)",
        params: [
          params.categoryId,
          params.serviceId,
          params.name,
          params.slug,
          params.basePrice,
          params.durationMin,
          params.isActive,
        ],
      },
    ],
    { prepare: true },
  );
}

// Conditional slug claim: true when this caller won the slug, false
// when another row already owns it (lost a concurrent race).
export async function claimServiceSlug(
  slug: string,
  serviceId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO services_by_slug (slug, service_id) VALUES (?, ?) IF NOT EXISTS",
    [slug, serviceId],
    { prepare: true },
  );
  return result.wasApplied();
}

// Conditional release: deletes the pointer only while it still points
// at this row, so a concurrent winner's claim is never removed.
export async function releaseServiceSlug(
  slug: string,
  serviceId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM services_by_slug WHERE slug = ? IF service_id = ?",
    [slug, serviceId],
    { prepare: true },
  );
  return result.wasApplied();
}

export type UpdateServiceParams = InsertServiceParams & {
  updatedAt: Date;
  oldCategoryId: string;
};

export async function updateServiceRows(
  params: UpdateServiceParams,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE services_by_id SET category_id = ?, category_name = ?, name = ?, slug = ?, image_url = ?, description = ?, base_price = ?, price_unit = ?, duration_min = ?, is_home_supported = ?, is_emergency_supported = ?, is_active = ?, updated_at = ? WHERE service_id = ?",
      params: [
        params.categoryId,
        params.categoryName,
        params.name,
        params.slug,
        params.imageUrl,
        params.description,
        params.basePrice,
        params.priceUnit,
        params.durationMin,
        params.isHomeSupported,
        params.isEmergencySupported,
        params.isActive,
        params.updatedAt,
        params.serviceId,
      ],
    },
  ];
  if (params.oldCategoryId !== params.categoryId) {
    queries.push({
      query:
        "DELETE FROM services_by_category WHERE category_id = ? AND service_id = ?",
      params: [params.oldCategoryId, params.serviceId],
    });
  }
  // Slug pointers are claimed/released by the caller with conditional
  // lightweight transactions (claimServiceSlug/releaseServiceSlug),
  // so they stay out of this batch.
  queries.push({
    query:
      "INSERT INTO services_by_category (category_id, service_id, name, slug, base_price, duration_min, is_active, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, false)",
    params: [
      params.categoryId,
      params.serviceId,
      params.name,
      params.slug,
      params.basePrice,
      params.durationMin,
      params.isActive,
    ],
  });
  await scylla.batch(queries, { prepare: true });
}

export async function setServiceActive(
  serviceId: string,
  categoryId: string,
  isActive: boolean,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "UPDATE services_by_id SET is_active = ?, updated_at = ? WHERE service_id = ?",
        params: [isActive, new Date(), serviceId],
      },
      {
        query:
          "UPDATE services_by_category SET is_active = ? WHERE category_id = ? AND service_id = ?",
        params: [isActive, categoryId, serviceId],
      },
    ],
    { prepare: true },
  );
}

export async function setServiceDeleted(
  serviceId: string,
  categoryId: string,
  isDeleted: boolean,
  deletedAt: Date | null,
): Promise<void> {
  const now = new Date();
  await scylla.batch(
    [
      {
        query:
          "UPDATE services_by_id SET is_deleted = ?, deleted_at = ?, updated_at = ? WHERE service_id = ?",
        params: [isDeleted, deletedAt, now, serviceId],
      },
      {
        query:
          "UPDATE services_by_category SET is_deleted = ? WHERE category_id = ? AND service_id = ?",
        params: [isDeleted, categoryId, serviceId],
      },
    ],
    { prepare: true },
  );
}

export async function hardDeleteService(
  serviceId: string,
  categoryId: string,
  slug: string,
): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM services_by_id WHERE service_id = ?",
        params: [serviceId],
      },
      {
        query:
          "DELETE FROM services_by_category WHERE category_id = ? AND service_id = ?",
        params: [categoryId, serviceId],
      },
      { query: "DELETE FROM services_by_slug WHERE slug = ?", params: [slug] },
    ],
    { prepare: true },
  );
}

// Bulk rename propagation: one atomic batch refreshes the denormalized
// category_name on every price row of a renamed category. Callers pass
// the member ids from listServiceRowsByCategory (no full-table scan).
export async function bulkRefreshServiceCategoryName(
  serviceIds: string[],
  categoryName: string,
): Promise<void> {
  if (serviceIds.length === 0) return;
  const now = new Date();
  await scylla.batch(
    serviceIds.map((serviceId) => ({
      query:
        "UPDATE services_by_id SET category_name = ?, updated_at = ? WHERE service_id = ?",
      params: [categoryName, now, serviceId],
    })),
    { prepare: true },
  );
}
