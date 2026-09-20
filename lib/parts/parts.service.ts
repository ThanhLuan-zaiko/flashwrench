import { randomUUID } from "node:crypto";
import {
  normalizeGalleryInput,
  normalizeSlug,
} from "@/lib/catalog/catalog-validation";
import {
  claimAssetsForOwner,
  pruneOwnerAssets,
} from "@/lib/media/media.service";
import { findPartCategoryRowById } from "./part-categories.repository";
import { toPartItem } from "./parts.mapper";
import {
  claimPartSku,
  claimPartSlug,
  findPartIdBySku,
  findPartIdBySlug,
  findPartRowById,
  insertPart,
  listPartRows,
  releasePartSku,
  releasePartSlug,
  updatePartRows,
} from "./parts.repository";
import {
  type CreatePartInput,
  isActiveFlag,
  isDeletedFlag,
  type PartItem,
  type PartsFieldErrors,
  type PartsResult,
  type UpdatePartInput,
} from "./parts.types";
import {
  normalizeCompatList,
  normalizeSku,
  normalizeSpecs,
  validatePartInput,
} from "./parts-validation";

export type ListPartsParams = {
  includeDeleted?: boolean;
  categoryId?: string;
};

function fail<T>(status: number, form: string): PartsResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: PartsFieldErrors,
): PartsResult<T> {
  return { ok: false, status, errors };
}

const SLUG_TAKEN = "Slug đã tồn tại. Vui lòng chọn slug khác.";
const SKU_TAKEN = "Mã SKU đã tồn tại. Vui lòng chọn mã khác.";

export async function listParts(
  params: ListPartsParams = {},
): Promise<PartsResult<PartItem[]>> {
  const rows = await listPartRows();
  const items = rows
    .filter((r) =>
      params.includeDeleted ? true : !isDeletedFlag(r.is_deleted),
    )
    .filter((r) =>
      params.categoryId ? r.category_id === params.categoryId : true,
    )
    .map(toPartItem)
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { ok: true, data: items };
}

export async function getPartById(
  partId: string,
): Promise<PartsResult<PartItem>> {
  const row = await findPartRowById(partId);
  if (!row) return fail(404, "Không tìm thấy sản phẩm.");
  return { ok: true, data: toPartItem(row) };
}

async function resolveCategory(categoryId: string) {
  const category = await findPartCategoryRowById(categoryId);
  if (!category || isDeletedFlag(category.is_deleted)) return null;
  return category;
}

function normalizePartInput(raw: CreatePartInput | UpdatePartInput) {
  const { imageUrls, imageAssetIds } = normalizeGalleryInput(raw);
  return {
    imageUrls,
    imageAssetIds,
    slug: normalizeSlug(raw.slug),
    sku: normalizeSku(raw.sku),
    brand: (raw.brand ?? "").trim(),
    carBrands: normalizeCompatList(raw.carBrands),
    carModels: normalizeCompatList(raw.carModels),
    specs: normalizeSpecs(raw.specs),
    description: (raw.description ?? "").trim(),
  };
}

function validatePart(
  raw: CreatePartInput | UpdatePartInput,
  n: ReturnType<typeof normalizePartInput>,
) {
  return validatePartInput({
    categoryId: raw.categoryId,
    name: raw.name.trim(),
    slug: n.slug,
    sku: n.sku,
    brand: n.brand || undefined,
    price: raw.price,
    comparePrice: raw.comparePrice,
    stockQty: raw.stockQty,
    carBrands: n.carBrands,
    carModels: n.carModels,
    images: n.imageUrls,
    specs: n.specs,
    description: n.description,
    isActive: raw.isActive,
  });
}

export async function createPart(
  raw: CreatePartInput,
): Promise<PartsResult<PartItem>> {
  const n = normalizePartInput(raw);
  const fieldErrors = validatePart(raw, n);
  if (fieldErrors) return failFields(400, fieldErrors);

  const category = await resolveCategory(raw.categoryId);
  if (!category) {
    return failFields(400, {
      categoryId: "Danh mục không tồn tại hoặc đang nằm trong thùng rác.",
    });
  }
  if (await findPartIdBySlug(n.slug))
    return failFields(409, { slug: SLUG_TAKEN });
  if (await findPartIdBySku(n.sku)) return failFields(409, { sku: SKU_TAKEN });

  const now = new Date();
  const partId = randomUUID();
  // Conditional claims win concurrent races for both unique pointers.
  if (!(await claimPartSlug(n.slug, partId))) {
    return failFields(409, { slug: SLUG_TAKEN });
  }
  if (!(await claimPartSku(n.sku, partId))) {
    await releasePartSlug(n.slug, partId);
    return failFields(409, { sku: SKU_TAKEN });
  }
  const claimed = await claimAssetsForOwner(n.imageAssetIds, "part", partId);
  if (!claimed.ok) {
    await releasePartSlug(n.slug, partId);
    await releasePartSku(n.sku, partId);
    return failFields(claimed.status, claimed.errors);
  }
  try {
    await insertPart({
      partId,
      sku: n.sku,
      name: raw.name.trim(),
      slug: n.slug,
      brand: n.brand,
      categoryId: category.category_id,
      categoryName: category.name ?? "",
      carBrands: n.carBrands,
      carModels: n.carModels,
      price: raw.price,
      comparePrice: raw.comparePrice ?? 0,
      stockQty: raw.stockQty,
      images: n.imageUrls,
      specs: n.specs,
      description: n.description,
      isActive: raw.isActive ?? true,
      now,
    });
  } catch (error) {
    await releasePartSlug(n.slug, partId);
    await releasePartSku(n.sku, partId);
    throw error;
  }
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không tạo được sản phẩm. Vui lòng thử lại.");
  return { ok: true, data: toPartItem(row) };
}

export async function updatePart(
  partId: string,
  raw: UpdatePartInput,
): Promise<PartsResult<PartItem>> {
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(
      400,
      "Sản phẩm đang nằm trong thùng rác. Hãy khôi phục trước khi sửa.",
    );
  }
  const n = normalizePartInput(raw);
  const fieldErrors = validatePart(raw, n);
  if (fieldErrors) return failFields(400, fieldErrors);

  const category = await resolveCategory(raw.categoryId);
  if (!category) {
    return failFields(400, {
      categoryId: "Danh mục không tồn tại hoặc đang nằm trong thùng rác.",
    });
  }
  const slugOwner = await findPartIdBySlug(n.slug);
  if (slugOwner && slugOwner !== partId) {
    return failFields(409, { slug: SLUG_TAKEN });
  }
  const skuOwner = await findPartIdBySku(n.sku);
  if (skuOwner && skuOwner !== partId) {
    return failFields(409, { sku: SKU_TAKEN });
  }
  const assetClaim = await claimAssetsForOwner(n.imageAssetIds, "part", partId);
  if (!assetClaim.ok) return failFields(assetClaim.status, assetClaim.errors);

  const oldSlug = existing.slug ?? n.slug;
  const oldSku = existing.sku ?? n.sku;
  if (oldSlug !== n.slug && !(await claimPartSlug(n.slug, partId))) {
    const owner = await findPartIdBySlug(n.slug);
    if (owner !== partId) return failFields(409, { slug: SLUG_TAKEN });
  }
  if (oldSku !== n.sku && !(await claimPartSku(n.sku, partId))) {
    const owner = await findPartIdBySku(n.sku);
    if (owner !== partId) return failFields(409, { sku: SKU_TAKEN });
  }

  await updatePartRows({
    partId,
    sku: n.sku,
    name: raw.name.trim(),
    slug: n.slug,
    brand: n.brand,
    categoryId: category.category_id,
    categoryName: category.name ?? "",
    carBrands: n.carBrands,
    carModels: n.carModels,
    price: raw.price,
    comparePrice: raw.comparePrice ?? 0,
    stockQty: raw.stockQty,
    images: n.imageUrls,
    specs: n.specs,
    description: n.description,
    isActive: raw.isActive ?? isActiveFlag(existing.is_active, true),
    updatedAt: new Date(),
    oldCategoryId: existing.category_id ?? category.category_id,
    oldBrand: existing.brand ?? "",
    // created_at is set on insert; a missing value would corrupt the
    // read-model clustering key, so fall back to the update time.
    createdAt: existing.created_at ?? new Date(),
  });
  // Covers dropped from the gallery lose their slot: remove files plus
  // registry rows best-effort so disk never fills with orphans.
  await pruneOwnerAssets("part", partId, n.imageUrls).catch(() => undefined);
  if (oldSlug !== n.slug) await releasePartSlug(oldSlug, partId);
  if (oldSku !== n.sku) await releasePartSku(oldSku, partId);
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không cập nhật được sản phẩm.");
  return { ok: true, data: toPartItem(row) };
}
