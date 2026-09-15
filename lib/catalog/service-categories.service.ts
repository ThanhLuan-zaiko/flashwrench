import { randomUUID } from "node:crypto";
import { normalizeSlug, validateCategoryInput } from "./catalog-validation";
import {
  type CatalogFieldErrors,
  type CreateCategoryInput,
  isActiveFlag,
  isDeletedFlag,
  type ServiceCategoryItem,
  type ServiceCategoryRow,
  toIso,
  type UpdateCategoryInput,
} from "./service-catalog.types";
import {
  claimCategorySlug,
  findCategoryIdBySlug,
  findCategoryRowById,
  hardDeleteCategory,
  insertCategory,
  listCategoryRows,
  releaseCategorySlug,
  setCategoryActive,
  setCategoryDeleted,
  updateCategoryRow,
} from "./service-categories.repository";
import {
  bulkRefreshServiceCategoryName,
  listServiceRows,
  listServiceRowsByCategory,
} from "./services.repository";

export type ListCategoriesParams = {
  includeDeleted?: boolean;
};

export type CatalogResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: CatalogFieldErrors };

function toItem(
  row: ServiceCategoryRow,
  serviceCount: number,
): ServiceCategoryItem {
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
    serviceCount,
  };
}

function fail<T>(status: number, form: string): CatalogResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: CatalogFieldErrors,
): CatalogResult<T> {
  return { ok: false, status, errors };
}

// List categories with live service counts. Deleted rows are hidden
// unless includeDeleted is true. Sorted by sortOrder then name.
export async function listServiceCategories(
  params: ListCategoriesParams = {},
): Promise<CatalogResult<ServiceCategoryItem[]>> {
  const [rows, services] = await Promise.all([
    listCategoryRows(),
    listServiceRows(),
  ]);
  const counts = new Map<string, number>();
  for (const s of services) {
    if (isDeletedFlag(s.is_deleted)) continue;
    if (!s.category_id) continue;
    counts.set(s.category_id, (counts.get(s.category_id) ?? 0) + 1);
  }
  const items = rows
    .filter((r) =>
      params.includeDeleted ? true : !isDeletedFlag(r.is_deleted),
    )
    .map((r) => toItem(r, counts.get(r.category_id) ?? 0))
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"),
    );
  return { ok: true, data: items };
}

async function countLiveServices(categoryId: string): Promise<number> {
  const services = await listServiceRows();
  return services.filter(
    (s) => s.category_id === categoryId && !isDeletedFlag(s.is_deleted),
  ).length;
}

export async function createServiceCategory(
  raw: CreateCategoryInput,
): Promise<CatalogResult<ServiceCategoryItem>> {
  const slug = normalizeSlug(raw.slug);
  const input = { ...raw, name: raw.name.trim(), slug };
  const fieldErrors = validateCategoryInput({
    name: input.name,
    slug,
    icon: input.icon,
    description: input.description,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const slugOwner = await findCategoryIdBySlug(slug);
  if (slugOwner) {
    return failFields(409, {
      slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
    });
  }

  const now = new Date();
  const categoryId = randomUUID();
  // Conditional claim wins concurrent races: only one creator owns
  // the slug. Re-check after a lost race in case the owner changed.
  if (!(await claimCategorySlug(slug, categoryId))) {
    return failFields(409, {
      slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
    });
  }
  try {
    await insertCategory({
      categoryId,
      name: input.name,
      slug,
      icon: (input.icon ?? "").trim(),
      description: (input.description ?? "").trim(),
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      now,
    });
  } catch (error) {
    // Never leave an orphan pointer behind when the main row fails.
    await releaseCategorySlug(slug, categoryId);
    throw error;
  }
  const row = await findCategoryRowById(categoryId);
  if (!row) return fail(500, "Không tạo được loại hình. Vui lòng thử lại.");
  return { ok: true, data: toItem(row, 0) };
}

export async function updateServiceCategory(
  categoryId: string,
  raw: UpdateCategoryInput,
): Promise<CatalogResult<ServiceCategoryItem>> {
  const existing = await findCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy loại hình.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(
      400,
      "Loại hình đang nằm trong thùng rác. Hãy khôi phục trước khi sửa.",
    );
  }
  const slug = normalizeSlug(raw.slug);
  const input = { ...raw, name: raw.name.trim(), slug };
  const fieldErrors = validateCategoryInput({
    name: input.name,
    slug,
    icon: input.icon,
    description: input.description,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const slugOwner = await findCategoryIdBySlug(slug);
  if (slugOwner && slugOwner !== categoryId) {
    return failFields(409, {
      slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
    });
  }

  const oldSlug = existing.slug ?? "";
  const slugChanged = Boolean(oldSlug) && oldSlug !== slug;
  if (slugChanged) {
    // Claim the new slug before touching the main row. A lost race
    // maps to 409 unless the pointer already belongs to this row.
    const claimed = await claimCategorySlug(slug, categoryId);
    if (!claimed) {
      const owner = await findCategoryIdBySlug(slug);
      if (owner !== categoryId) {
        return failFields(409, {
          slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
        });
      }
    }
  }

  const now = new Date();
  await updateCategoryRow({
    categoryId,
    name: input.name,
    slug,
    icon: (input.icon ?? "").trim(),
    description: (input.description ?? "").trim(),
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? isActiveFlag(existing.is_active, true),
    updatedAt: now,
  });
  if (slugChanged) {
    // Best effort: the old pointer is released only while it still
    // belongs to this row, so a concurrent winner is never removed.
    await releaseCategorySlug(oldSlug, categoryId);
  }
  // Keep denormalized category_name on services in sync with the new
  // name. Members come from the by-category index (no full scan) and
  // refresh in one atomic batch instead of N parallel writes.
  if ((existing.name ?? "") !== input.name) {
    const members = await listServiceRowsByCategory(categoryId);
    await bulkRefreshServiceCategoryName(
      members.map((m) => m.service_id),
      input.name,
    );
  }
  const row = await findCategoryRowById(categoryId);
  if (!row) return fail(500, "Không cập nhật được loại hình.");
  return { ok: true, data: toItem(row, await countLiveServices(categoryId)) };
}

export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<CatalogResult<ServiceCategoryItem>> {
  const existing = await findCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy loại hình.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Loại hình đang nằm trong thùng rác, không thể bật/tắt.");
  }
  await setCategoryActive(categoryId, isActive, new Date());
  const row = await findCategoryRowById(categoryId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toItem(row, await countLiveServices(categoryId)) };
}

// Soft delete hides the category (trash, restorable). Blocked while the
// category still holds live services so prices never become orphaned.
export async function softDeleteCategory(
  categoryId: string,
): Promise<CatalogResult<ServiceCategoryItem>> {
  const existing = await findCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy loại hình.");
  if (isDeletedFlag(existing.is_deleted))
    return fail(400, "Loại hình đã nằm trong thùng rác.");
  const live = await countLiveServices(categoryId);
  if (live > 0) {
    return fail(
      400,
      `Còn ${live} mục giá đang dùng loại hình này. Hãy chuyển hoặc xóa mềm các mục giá trước.`,
    );
  }
  const now = new Date();
  await setCategoryDeleted(categoryId, true, now, now);
  const row = await findCategoryRowById(categoryId);
  if (!row) return fail(500, "Không xóa được loại hình.");
  return { ok: true, data: toItem(row, 0) };
}

export async function restoreCategory(
  categoryId: string,
): Promise<CatalogResult<ServiceCategoryItem>> {
  const existing = await findCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy loại hình.");
  if (!isDeletedFlag(existing.is_deleted))
    return fail(400, "Loại hình không nằm trong thùng rác.");
  await setCategoryDeleted(categoryId, false, null, new Date());
  const row = await findCategoryRowById(categoryId);
  if (!row) return fail(500, "Không khôi phục được loại hình.");
  return { ok: true, data: toItem(row, await countLiveServices(categoryId)) };
}

// Hard delete is permanent: the row, its slug pointer vanish. Requires the
// caller to pass confirm equal to the slug, and the category must be empty
// (no services at all, even soft-deleted ones) to avoid orphan prices.
export async function hardDeleteCategoryWithConfirm(
  categoryId: string,
  confirm: string,
): Promise<CatalogResult<{ id: string }>> {
  const existing = await findCategoryRowById(categoryId);
  if (!existing) return fail(404, "Không tìm thấy loại hình.");
  const slug = existing.slug ?? "";
  if (normalizeSlug(confirm) !== slug) {
    return failFields(400, {
      confirm: "Mã xác nhận chưa đúng. Hãy nhập đúng slug để xóa vĩnh viễn.",
    });
  }
  const services = await listServiceRows();
  const referencing = services.filter(
    (s) => s.category_id === categoryId,
  ).length;
  if (referencing > 0) {
    return fail(
      400,
      `Còn ${referencing} mục giá thuộc loại hình này (kể cả trong thùng rác). Hãy xóa vĩnh viễn các mục giá trước.`,
    );
  }
  await hardDeleteCategory(categoryId, slug);
  return { ok: true, data: { id: categoryId } };
}
