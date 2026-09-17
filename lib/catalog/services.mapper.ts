import {
  isActiveFlag,
  isDeletedFlag,
  type PriceUnit,
  type ServiceItem,
  type ServiceRow,
  toIso,
} from "./service-catalog.types";

// Row-to-item mapping for price rows. Extracted so services.service.ts
// stays under the file line limit once media lifecycle calls join it.
// The gallery column holds display-order URLs; image_url mirrors the
// cover (first image) so legacy readers without images keep working.
export function toServiceItem(row: ServiceRow): ServiceItem {
  const gallery = Array.isArray(row.images)
    ? row.images.filter((u): u is string => typeof u === "string")
    : [];
  const cover = row.image_url ?? gallery[0] ?? "";
  const images = gallery.length > 0 ? gallery : cover ? [cover] : [];
  return {
    id: row.service_id,
    categoryId: row.category_id ?? "",
    categoryName: row.category_name ?? "",
    name: row.name ?? "",
    slug: row.slug ?? "",
    imageUrl: cover,
    images,
    description: row.description ?? "",
    basePrice: row.base_price ?? 0,
    priceUnit: (row.price_unit as PriceUnit) ?? "per_job",
    durationMin: row.duration_min ?? 0,
    isHomeSupported: row.is_home_supported ?? true,
    isEmergencySupported: row.is_emergency_supported ?? false,
    isActive: isActiveFlag(row.is_active, true),
    isDeleted: isDeletedFlag(row.is_deleted),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
  };
}
