import {
  isActiveFlag,
  isDeletedFlag,
  type ServiceCategoryItem,
  type ServiceCategoryRow,
  toIso,
} from "./service-catalog.types";

// Row-to-item mapping for service categories. The gallery column holds
// display-order URLs; image_url mirrors the cover (first image) so
// legacy readers without images keep working.
export function toCategoryItem(
  row: ServiceCategoryRow,
  serviceCount: number,
): ServiceCategoryItem {
  const gallery = Array.isArray(row.images)
    ? row.images.filter((u): u is string => typeof u === "string")
    : [];
  const cover = row.image_url ?? gallery[0] ?? "";
  const images = gallery.length > 0 ? gallery : cover ? [cover] : [];
  return {
    id: row.category_id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    icon: row.icon ?? "",
    imageUrl: cover,
    images,
    description: row.description ?? "",
    sortOrder: row.sort_order ?? 0,
    isActive: isActiveFlag(row.is_active, true),
    isDeleted: isDeletedFlag(row.is_deleted),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    deletedAt: toIso(row.deleted_at),
    serviceCount,
  };
}
