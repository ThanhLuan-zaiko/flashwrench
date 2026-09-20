import {
  isActiveFlag,
  isDeletedFlag,
  type PartCategoryItem,
  type PartCategoryRow,
  type PartItem,
  type PartRow,
  toIso,
} from "./parts.types";

// DECIMAL columns come back as driver BigDecimal objects; coerce through
// String so both numbers and driver objects map cleanly.
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringSet(value: unknown): string[] {
  if (!value) return [];
  if (value instanceof Set) {
    return [...value].filter((v): v is string => typeof v === "string");
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

function toSpecs(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string") out[key] = raw;
  }
  return out;
}

export function toPartCategoryItem(
  row: PartCategoryRow,
  partCount = 0,
): PartCategoryItem {
  return {
    id: row.category_id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    icon: row.icon ?? "",
    description: row.description ?? "",
    sortOrder: row.sort_order ?? 0,
    isActive: isActiveFlag(row.is_active, true),
    isDeleted: isDeletedFlag(row.is_deleted),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
    partCount,
  };
}

export function toPartItem(row: PartRow): PartItem {
  const images = Array.isArray(row.images)
    ? row.images.filter((u): u is string => typeof u === "string")
    : [];
  return {
    id: row.part_id,
    sku: row.sku ?? "",
    name: row.name ?? "",
    slug: row.slug ?? "",
    brand: row.brand ?? "",
    categoryId: row.category_id ?? "",
    categoryName: row.category_name ?? "",
    carBrands: toStringSet(row.car_brands),
    carModels: toStringSet(row.car_models),
    price: toNumber(row.price) ?? 0,
    comparePrice: toNumber(row.compare_price) ?? 0,
    stockQty: toNumber(row.stock_qty) ?? 0,
    soldCount: toNumber(row.sold_count) ?? 0,
    images,
    imageUrl: images[0] ?? "",
    specs: toSpecs(row.specs),
    description: row.description ?? "",
    ratingAvg: toNumber(row.rating_avg) ?? 0,
    ratingCount: toNumber(row.rating_count) ?? 0,
    isActive: isActiveFlag(row.is_active, true),
    isDeleted: isDeletedFlag(row.is_deleted),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
  };
}
