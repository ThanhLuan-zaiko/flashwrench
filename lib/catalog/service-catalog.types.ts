// Shared row/response shapes for the service catalog domain.
// Repositories map raw CQL rows to these rows; services map rows to items.

export type PriceUnit = "per_job" | "per_hour" | "per_item";

export type ServiceCategoryRow = {
  category_id: string;
  name: string | null;
  slug: string | null;
  icon: string | null;
  image_url: string | null;
  images: string[] | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type ServiceRow = {
  service_id: string;
  category_id: string | null;
  category_name: string | null;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  images: string[] | null;
  description: string | null;
  base_price: number | null;
  price_unit: string | null;
  duration_min: number | null;
  is_home_supported: boolean | null;
  is_emergency_supported: boolean | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type ServiceCategoryBySlugRow = {
  slug: string;
  category_id: string;
};

export type ServiceByCategoryRow = {
  category_id: string;
  service_id: string;
  name: string | null;
  slug: string | null;
  base_price: number | null;
  duration_min: number | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
};

export type ServiceBySlugRow = {
  slug: string;
  service_id: string;
};

export type ServiceCategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl: string;
  images: string[];
  description: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  serviceCount: number;
};

export type ServiceItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  imageUrl: string;
  images: string[];
  description: string;
  basePrice: number;
  priceUnit: PriceUnit;
  durationMin: number;
  isHomeSupported: boolean;
  isEmergencySupported: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  imageAssetId?: string;
  images?: string[];
  imageAssetIds?: string[];
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateCategoryInput = {
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  imageAssetId?: string;
  images?: string[];
  imageAssetIds?: string[];
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CreateServiceInput = {
  categoryId: string;
  name: string;
  slug: string;
  imageUrl?: string;
  imageAssetId?: string;
  images?: string[];
  imageAssetIds?: string[];
  description?: string;
  basePrice: number;
  priceUnit: PriceUnit;
  durationMin: number;
  isHomeSupported?: boolean;
  isEmergencySupported?: boolean;
  isActive?: boolean;
};

export type UpdateServiceInput = {
  categoryId: string;
  name: string;
  slug: string;
  imageUrl?: string;
  imageAssetId?: string;
  images?: string[];
  imageAssetIds?: string[];
  description?: string;
  basePrice: number;
  priceUnit: PriceUnit;
  durationMin: number;
  isHomeSupported?: boolean;
  isEmergencySupported?: boolean;
  isActive?: boolean;
};

export type CatalogFieldErrors = Partial<
  Record<
    | "name"
    | "slug"
    | "icon"
    | "imageUrl"
    | "imageAssetId"
    | "description"
    | "sortOrder"
    | "isActive"
    | "categoryId"
    | "basePrice"
    | "priceUnit"
    | "durationMin"
    | "isHomeSupported"
    | "isEmergencySupported"
    | "confirm"
    | "form",
    string
  >
>;

export function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function isDeletedFlag(value: boolean | null): boolean {
  return value === true;
}

export function isActiveFlag(value: boolean | null, fallback = true): boolean {
  return value === null || value === undefined ? fallback : value;
}
