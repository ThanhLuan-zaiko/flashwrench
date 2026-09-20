import {
  MAX_COVER_IMAGES,
  normalizeSlug,
  SLUG_PATTERN,
} from "@/lib/catalog/catalog-validation";
import type { PartsFieldErrors } from "./parts.types";

export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$/;
export const MAX_SPEC_ENTRIES = 30;
export const MAX_COMPAT_ITEMS = 30;

export function normalizeSku(raw: string): string {
  return raw.trim().toUpperCase();
}

export function normalizeCompatList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const value = entry.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= MAX_COMPAT_ITEMS) break;
  }
  return out;
}

// Specs arrive as a flat record; trim keys/values and cap the entry count.
export function normalizeSpecs(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    const name = key.trim();
    const text = value.trim();
    if (!name || !text) continue;
    out[name] = text;
    if (Object.keys(out).length >= MAX_SPEC_ENTRIES) break;
  }
  return out;
}

function checkName(name: string, errors: PartsFieldErrors): void {
  const trimmed = name.trim();
  if (!trimmed) errors.name = "Tên không được để trống.";
  else if (trimmed.length > 120) errors.name = "Tên tối đa 120 ký tự.";
}

function checkSlug(slug: string, errors: PartsFieldErrors): void {
  if (!slug) errors.slug = "Slug không được để trống.";
  else if (slug.length < 3 || slug.length > 80)
    errors.slug = "Slug phải dài từ 3 đến 80 ký tự.";
  else if (!SLUG_PATTERN.test(slug))
    errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
}

function checkImageUrls(imageUrls: string[], errors: PartsFieldErrors): void {
  if (imageUrls.length > MAX_COVER_IMAGES) {
    errors.images = `Tối đa ${MAX_COVER_IMAGES} ảnh cho mỗi sản phẩm.`;
    return;
  }
  for (const url of imageUrls) {
    if (
      url.length > 500 ||
      !url.startsWith("/api/media/") ||
      url.includes(" ") ||
      url.includes("\\") ||
      url.includes("..")
    ) {
      errors.images = "Ảnh sản phẩm phải là ảnh đã tải lên từ kho media.";
      return;
    }
  }
}

function checkOptionalBoolean(
  value: unknown,
  field: "isActive",
  errors: PartsFieldErrors,
): void {
  if (value !== undefined && typeof value !== "boolean") {
    errors[field] = "Trạng thái hoạt động không hợp lệ.";
  }
}

function checkMoney(
  value: unknown,
  field: "price" | "comparePrice",
  required: boolean,
  errors: PartsFieldErrors,
): void {
  if (value === undefined || value === null) {
    if (required) errors[field] = "Vui lòng nhập giá bán.";
    return;
  }
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Math.floor(value) !== value ||
    value < 0 ||
    value > 1_000_000_000
  ) {
    errors[field] = "Giá phải là số nguyên từ 0 đến 1.000.000.000đ.";
  }
}

function checkCompatList(
  value: string[],
  field: "carBrands" | "carModels",
  errors: PartsFieldErrors,
): void {
  if (value.length > MAX_COMPAT_ITEMS) {
    errors[field] = `Tối đa ${MAX_COMPAT_ITEMS} mục tương thích.`;
    return;
  }
  for (const entry of value) {
    if (entry.length > 60) {
      errors[field] = "Mỗi mục tương thích tối đa 60 ký tự.";
      return;
    }
  }
}

function checkSpecs(
  specs: Record<string, string>,
  errors: PartsFieldErrors,
): void {
  for (const [key, value] of Object.entries(specs)) {
    if (key.length > 60 || value.length > 120) {
      errors.specs = "Tên thông số tối đa 60 ký tự, giá trị tối đa 120 ký tự.";
      return;
    }
  }
}

export function validatePartCategoryInput(input: {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
  isActive?: unknown;
}): PartsFieldErrors | null {
  const errors: PartsFieldErrors = {};
  checkName(input.name, errors);
  checkSlug(normalizeSlug(input.slug), errors);
  if (input.icon !== undefined && input.icon.length > 60) {
    errors.icon = "Tên icon tối đa 60 ký tự.";
  }
  if (input.description !== undefined && input.description.length > 500) {
    errors.description = "Mô tả tối đa 500 ký tự.";
  }
  if (
    input.sortOrder !== undefined &&
    (!Number.isInteger(input.sortOrder) ||
      input.sortOrder < 0 ||
      input.sortOrder > 9999)
  ) {
    errors.sortOrder = "Thứ tự phải là số nguyên từ 0 đến 9999.";
  }
  checkOptionalBoolean(input.isActive, "isActive", errors);
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validatePartInput(input: {
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
  specs?: Record<string, string>;
  description?: string;
  isActive?: unknown;
}): PartsFieldErrors | null {
  const errors: PartsFieldErrors = {};
  checkName(input.name, errors);
  checkSlug(normalizeSlug(input.slug), errors);
  const sku = normalizeSku(input.sku);
  if (!sku) errors.sku = "Mã SKU không được để trống.";
  else if (!SKU_PATTERN.test(sku))
    errors.sku = "SKU chỉ gồm chữ, số, dấu chấm, gạch ngang và gạch dưới.";
  if (!input.categoryId) {
    errors.categoryId = "Vui lòng chọn danh mục linh kiện.";
  }
  if (input.brand !== undefined && input.brand.length > 60) {
    errors.brand = "Tên thương hiệu tối đa 60 ký tự.";
  }
  checkMoney(input.price, "price", true, errors);
  checkMoney(input.comparePrice, "comparePrice", false, errors);
  if (
    !errors.price &&
    !errors.comparePrice &&
    typeof input.comparePrice === "number" &&
    input.comparePrice > 0 &&
    input.comparePrice < input.price
  ) {
    errors.comparePrice = "Giá niêm yết phải lớn hơn hoặc bằng giá bán.";
  }
  if (
    typeof input.stockQty !== "number" ||
    !Number.isInteger(input.stockQty) ||
    input.stockQty < 0 ||
    input.stockQty > 1_000_000
  ) {
    errors.stockQty = "Tồn kho phải là số nguyên từ 0 đến 1.000.000.";
  }
  checkImageUrls(input.images ?? [], errors);
  checkCompatList(input.carBrands ?? [], "carBrands", errors);
  checkCompatList(input.carModels ?? [], "carModels", errors);
  checkSpecs(input.specs ?? {}, errors);
  if (input.description !== undefined && input.description.length > 2000) {
    errors.description = "Mô tả tối đa 2000 ký tự.";
  }
  checkOptionalBoolean(input.isActive, "isActive", errors);
  return Object.keys(errors).length > 0 ? errors : null;
}
