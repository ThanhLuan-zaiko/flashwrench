// Shared row/response shapes for the auto parts shop domain.
// Repositories map raw CQL rows to these rows; services map rows to items.

export type PartCategoryRow = {
  category_id: string;
  name: string | null;
  slug: string | null;
  icon: string | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type PartRow = {
  part_id: string;
  sku: string | null;
  name: string | null;
  slug: string | null;
  brand: string | null;
  category_id: string | null;
  category_name: string | null;
  car_brands: string[] | null;
  car_models: string[] | null;
  price: number | null;
  compare_price: number | null;
  stock_qty: number | null;
  sold_count: number | null;
  images: string[] | null;
  specs: Record<string, string> | null;
  description: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type PartByCategoryRow = {
  category_id: string;
  created_at: Date | null;
  part_id: string;
  name: string | null;
  slug: string | null;
  brand: string | null;
  image: string | null;
  price: number | null;
  stock_qty: number | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
};

export type PartCategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  partCount: number;
};

export type PartItem = {
  id: string;
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
  soldCount: number;
  images: string[];
  imageUrl: string;
  specs: Record<string, string>;
  description: string;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

export type CreatePartCategoryInput = {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdatePartCategoryInput = CreatePartCategoryInput;

export type CreatePartInput = {
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  price: number;
  comparePrice?: number;
  stockQty: number;
  carBrands?: string[];
  carModels?: string[];
  images?: string[];
  imageAssetIds?: string[];
  specs?: Record<string, string>;
  description?: string;
  isActive?: boolean;
};

export type UpdatePartInput = CreatePartInput;

export type PartsFieldErrors = Partial<
  Record<
    | "name"
    | "slug"
    | "sku"
    | "brand"
    | "categoryId"
    | "price"
    | "comparePrice"
    | "stockQty"
    | "carBrands"
    | "carModels"
    | "imageUrl"
    | "images"
    | "specs"
    | "description"
    | "sortOrder"
    | "icon"
    | "isActive"
    | "confirm"
    | "stock"
    | "form",
    string
  >
>;

export type PartsResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: PartsFieldErrors };

export function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function isDeletedFlag(value: boolean | null): boolean {
  return value === true;
}

export function isActiveFlag(value: boolean | null, fallback = true): boolean {
  return value === null || value === undefined ? fallback : value;
}
