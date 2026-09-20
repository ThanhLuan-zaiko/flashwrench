import { randomUUID } from "node:crypto";
import { normalizeSlug } from "@/lib/catalog/catalog-validation";
import {
  claimPartCategorySlug,
  findPartCategoryIdBySlug,
  findPartCategoryRowById,
  hardDeletePartCategory,
  insertPartCategory,
  listPartCategoryRows,
  releasePartCategorySlug,
  setPartCategoryActive,
  setPartCategoryDeleted,
  updatePartCategoryRow,
} from "./part-categories.repository";
import { toPartCategoryItem } from "./parts.mapper";
import { listPartRows } from "./parts.repository";
import {
  type CreatePartCategoryInput,
  isDeletedFlag,
  type PartCategoryItem,
  type PartsFieldErrors,
  type PartsResult,
  type UpdatePartCategoryInput,
} from "./parts.types";
import { validatePartCategoryInput } from "./parts-validation";

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

export async function listPartCategories(
  params: { includeDeleted?: boolean } = {},
): Promise<PartsResult<PartCategoryItem[]>> {
  const [rows, parts] = await Promise.all([
    listPartCategoryRows(),
    listPartRows(),
  ]);
  const counts = new Map<string, number>();
  for (const part of parts) {
    if (!part.category_id || isDeletedFlag(part.is_deleted)) continue;
    counts.set(part.category_id, (counts.get(part.category_id) ?? 0) + 1);
  }
  const items = rows
    .filter((r) =>
      params.includeDeleted ? true : !isDeletedFlag(r.is_deleted),
    )
    .map((r) => toPartCategoryItem(r, counts.get(r.category_id) ?? 0))
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"),
    );
  return { ok: true, data: items };
}

export async function createPartCategory(
  raw: CreatePartCategoryInput,
): Promise<PartsResult<PartCategoryItem>> {
  const slug = normalizeSlug(raw.slug);
  const fieldErrors = validatePartCategoryInput({
    name: raw.name.trim(),
    slug,
    icon: raw.icon,
    description: raw.description,
    sortOrder: raw.sortOrder,
    isActive: raw.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);
  if (await findPartCategoryIdBySlug(slug)) {
    return failFields(409, { slug: SLUG_TAKEN });
  }
  const now = new Date();
  const categoryId = randomUUID();
  // Conditional claim wins concurrent races: only one creator owns the slug.
  if (!(await claimPartCategorySlug(slug, categoryId))) {
    return failFields(409, { slug: SLUG_TAKEN });
  }
  try {
    await insertPartCategory({
      categoryId,
      name: raw.name.trim(),
      slug,
      icon: (raw.icon ?? "").trim(),
      description: (raw.description ?? "").trim(),
      sortOrder: raw.sortOrder ?? 0,
      isActive: raw.isActive ?? true,
      now,
    });
  } catch (error) {
    await releasePartCategorySlug(slug, categoryId);
    throw error;
  }
  const row = await findPartCategoryRowById(categoryId);
  if (!row) return fail(500, "Không tạo được danh mục. Vui lòng thử lại.");
  return { ok: true, data: toPartCategoryItem(row) };
}

export async function updatePartCategory(
  categoryId: string,
  raw: UpdatePartCategoryInput,
): Promise<PartsResult<PartCategoryItem>> {
  const existing = await findPartCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy danh mục.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(
      400,
      "Danh mục đang nằm trong thùng rác. Hãy khôi phục trước khi sửa.",
    );
  }
  const slug = normalizeSlug(raw.slug);
  const fieldErrors = validatePartCategoryInput({
    name: raw.name.trim(),
    slug,
    icon: raw.icon,
    description: raw.description,
    sortOrder: raw.sortOrder,
    isActive: raw.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);
  const slugOwner = await findPartCategoryIdBySlug(slug);
  if (slugOwner && slugOwner !== categoryId) {
    return failFields(409, { slug: SLUG_TAKEN });
  }
  const oldSlug = existing.slug ?? slug;
  if (oldSlug !== slug) {
    const claimed = await claimPartCategorySlug(slug, categoryId);
    if (!claimed) {
      const owner = await findPartCategoryIdBySlug(slug);
      if (owner !== categoryId) return failFields(409, { slug: SLUG_TAKEN });
    }
  }
  await updatePartCategoryRow({
    categoryId,
    name: raw.name.trim(),
    slug,
    icon: (raw.icon ?? "").trim(),
    description: (raw.description ?? "").trim(),
    sortOrder: raw.sortOrder ?? 0,
    isActive: raw.isActive ?? existing.is_active !== false,
    updatedAt: new Date(),
  });
  if (oldSlug !== slug) {
    // Best effort: released only while the pointer still belongs to this row.
    await releasePartCategorySlug(oldSlug, categoryId);
  }
  const row = await findPartCategoryRowById(categoryId);
  if (!row) return fail(500, "Không cập nhật được danh mục.");
  return { ok: true, data: toPartCategoryItem(row) };
}

export async function togglePartCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<PartsResult<PartCategoryItem>> {
  const existing = await findPartCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy danh mục.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Danh mục đang nằm trong thùng rác, không thể bật/tắt.");
  }
  await setPartCategoryActive(categoryId, isActive, new Date());
  const row = await findPartCategoryRowById(categoryId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toPartCategoryItem(row) };
}

// Soft delete hides the category; parts inside keep their rows but the
// storefront hides them together with the category (see public service).
export async function softDeletePartCategory(
  categoryId: string,
): Promise<PartsResult<PartCategoryItem>> {
  const existing = await findPartCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy danh mục.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Danh mục đã nằm trong thùng rác.");
  }
  const parts = await listPartRows();
  const hasLivePart = parts.some(
    (p) => p.category_id === categoryId && !isDeletedFlag(p.is_deleted),
  );
  if (hasLivePart) {
    return fail(
      400,
      "Danh mục còn sản phẩm đang bán. Hãy chuyển hoặc xóa sản phẩm trước.",
    );
  }
  await setPartCategoryDeleted(categoryId, true, new Date(), new Date());
  const row = await findPartCategoryRowById(categoryId);
  if (!row) return fail(500, "Không xóa được danh mục.");
  return { ok: true, data: toPartCategoryItem(row) };
}

export async function restorePartCategory(
  categoryId: string,
): Promise<PartsResult<PartCategoryItem>> {
  const existing = await findPartCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy danh mục.");
  if (!isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Danh mục không nằm trong thùng rác.");
  }
  await setPartCategoryDeleted(categoryId, false, null, new Date());
  const row = await findPartCategoryRowById(categoryId);
  if (!row) return fail(500, "Không khôi phục được danh mục.");
  return { ok: true, data: toPartCategoryItem(row) };
}

// Hard delete is permanent: main row plus slug pointer go away. The caller
// must echo the slug back as confirm, matching the type-to-confirm dialog.
export async function hardDeletePartCategoryWithConfirm(
  categoryId: string,
  confirm: string,
): Promise<PartsResult<{ id: string }>> {
  const existing = await findPartCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy danh mục.");
  const slug = existing.slug ?? "";
  if (normalizeSlug(confirm) !== slug) {
    return failFields(400, {
      confirm: "Mã xác nhận chưa đúng. Hãy nhập đúng slug để xóa vĩnh viễn.",
    });
  }
  const parts = await listPartRows();
  if (parts.some((p) => p.category_id === categoryId)) {
    return fail(
      400,
      "Danh mục vẫn còn sản phẩm. Hãy xóa vĩnh viễn từng sản phẩm trước.",
    );
  }
  await hardDeletePartCategory(categoryId, slug);
  return { ok: true, data: { id: categoryId } };
}
