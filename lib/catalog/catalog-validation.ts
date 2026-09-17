import type { CatalogFieldErrors, PriceUnit } from "./service-catalog.types";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRICE_UNITS: PriceUnit[] = ["per_job", "per_hour", "per_item"];

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function slugifyName(name: string): string {
  const withoutDiacritics = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function checkSlug(slug: string, errors: CatalogFieldErrors): boolean {
  if (!slug) {
    errors.slug = "Slug không được để trống.";
    return false;
  }
  if (slug.length < 3 || slug.length > 80) {
    errors.slug = "Slug phải dài từ 3 đến 80 ký tự.";
    return false;
  }
  if (!SLUG_PATTERN.test(slug)) {
    errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
    return false;
  }
  return true;
}

function checkName(name: string, errors: CatalogFieldErrors): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    errors.name = "Tên không được để trống.";
    return false;
  }
  if (trimmed.length > 120) {
    errors.name = "Tên tối đa 120 ký tự.";
    return false;
  }
  return true;
}

// Cover images must come from our own media storage: external hotlinks
// break, leak referrers and bypass the upload guardrails. Empty means
// "no image", which every surface renders as its current layout.
export function normalizeImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

// Max staged covers per catalog row (categories and services share the
// same deferred gallery UX and media guardrails).
export const MAX_COVER_IMAGES = 5;

export function normalizeImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const url = entry.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= MAX_COVER_IMAGES) break;
  }
  return out;
}

export type NormalizedGalleryInput = {
  imageUrls: string[];
  imageAssetIds: string[];
};

// Gallery preamble for catalog rows: deduped display-order URLs plus the
// matching fresh asset ids. Legacy single-cover fields fall back here
// so old clients keep working without changes.
export function normalizeGalleryInput(raw: {
  images?: unknown;
  imageAssetIds?: unknown;
  imageUrl?: unknown;
  imageAssetId?: unknown;
}): NormalizedGalleryInput {
  const imageUrls = normalizeImageUrls(raw.images);
  const ids = Array.isArray(raw.imageAssetIds)
    ? raw.imageAssetIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_COVER_IMAGES)
    : [];
  if (imageUrls.length === 0) {
    const legacyUrl = normalizeImageUrl(raw.imageUrl);
    const legacyId =
      typeof raw.imageAssetId === "string" && raw.imageAssetId.trim()
        ? raw.imageAssetId.trim()
        : undefined;
    return {
      imageUrls: legacyUrl ? [legacyUrl] : [],
      imageAssetIds: legacyId ? [legacyId] : [],
    };
  }
  return { imageUrls, imageAssetIds: ids };
}

function checkImageUrl(imageUrl: string, errors: CatalogFieldErrors): void {
  if (!imageUrl) return;
  if (
    imageUrl.length > 500 ||
    !imageUrl.startsWith("/api/media/") ||
    imageUrl.includes(" ") ||
    imageUrl.includes("\\") ||
    imageUrl.includes("..")
  ) {
    errors.imageUrl = "Ảnh bìa phải là ảnh đã tải lên từ kho media.";
  }
}

function checkImageUrls(imageUrls: string[], errors: CatalogFieldErrors): void {
  if (imageUrls.length > MAX_COVER_IMAGES) {
    errors.imageUrl = `Tối đa ${MAX_COVER_IMAGES} ảnh cho mỗi mục.`;
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
      errors.imageUrl = "Ảnh bìa phải là ảnh đã tải lên từ kho media.";
      return;
    }
  }
}

function checkOptionalBoolean(
  value: unknown,
  field: "isActive" | "isHomeSupported" | "isEmergencySupported",
  message: string,
  errors: CatalogFieldErrors,
): void {
  if (value !== undefined && typeof value !== "boolean") {
    errors[field] = message;
  }
}

export function validateCategoryInput(input: {
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: unknown;
  images?: unknown;
  description?: string;
  sortOrder?: number;
  isActive?: unknown;
}): CatalogFieldErrors | null {
  const errors: CatalogFieldErrors = {};
  checkName(input.name, errors);
  checkSlug(normalizeSlug(input.slug), errors);
  const gallery = normalizeImageUrls(input.images);
  if (gallery.length > 0) {
    checkImageUrls(gallery, errors);
  } else {
    checkImageUrl(normalizeImageUrl(input.imageUrl), errors);
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
  if (input.icon !== undefined && input.icon.length > 60) {
    errors.icon = "Tên icon tối đa 60 ký tự.";
  }
  checkOptionalBoolean(
    input.isActive,
    "isActive",
    "Trạng thái hoạt động không hợp lệ.",
    errors,
  );
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateServiceInput(input: {
  categoryId: string;
  name: string;
  slug: string;
  imageUrl?: unknown;
  images?: unknown;
  description?: string;
  basePrice: number;
  priceUnit: string;
  durationMin: number;
  isHomeSupported?: unknown;
  isEmergencySupported?: unknown;
  isActive?: unknown;
}): CatalogFieldErrors | null {
  const errors: CatalogFieldErrors = {};
  checkName(input.name, errors);
  checkSlug(normalizeSlug(input.slug), errors);
  const gallery = normalizeImageUrls(input.images);
  if (gallery.length > 0) {
    checkImageUrls(gallery, errors);
  } else {
    checkImageUrl(normalizeImageUrl(input.imageUrl), errors);
  }
  if (!input.categoryId) {
    errors.categoryId = "Vui lòng chọn loại hình dịch vụ.";
  }
  if (
    typeof input.basePrice !== "number" ||
    !Number.isFinite(input.basePrice) ||
    Math.floor(input.basePrice) !== input.basePrice ||
    input.basePrice < 0 ||
    input.basePrice > 1_000_000_000
  ) {
    errors.basePrice = "Giá phải là số nguyên từ 0 đến 1.000.000.000đ.";
  }
  if (!PRICE_UNITS.includes(input.priceUnit as PriceUnit)) {
    errors.priceUnit = "Đơn vị tính không hợp lệ.";
  }
  if (
    typeof input.durationMin !== "number" ||
    !Number.isInteger(input.durationMin) ||
    input.durationMin < 5 ||
    input.durationMin > 2880
  ) {
    errors.durationMin = "Thời lượng từ 5 đến 2880 phút.";
  }
  if (input.description !== undefined && input.description.length > 1000) {
    errors.description = "Mô tả tối đa 1000 ký tự.";
  }
  checkOptionalBoolean(
    input.isHomeSupported,
    "isHomeSupported",
    "Cờ hỗ trợ tại nhà không hợp lệ.",
    errors,
  );
  checkOptionalBoolean(
    input.isEmergencySupported,
    "isEmergencySupported",
    "Cờ hỗ trợ cứu hộ không hợp lệ.",
    errors,
  );
  checkOptionalBoolean(
    input.isActive,
    "isActive",
    "Trạng thái hoạt động không hợp lệ.",
    errors,
  );
  return Object.keys(errors).length > 0 ? errors : null;
}
