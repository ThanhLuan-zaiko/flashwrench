import { randomUUID } from "node:crypto";
import { normalizeSlug, validateServiceInput } from "./catalog-validation";
import {
  type CatalogFieldErrors,
  type CreateServiceInput,
  isActiveFlag,
  isDeletedFlag,
  type PriceUnit,
  type ServiceItem,
  type ServiceRow,
  toIso,
  type UpdateServiceInput,
} from "./service-catalog.types";
import { findCategoryRowById } from "./service-categories.repository";
import {
  findServiceIdBySlug,
  findServiceRowById,
  hardDeleteService,
  insertService,
  listServiceRows,
  setServiceActive,
  setServiceDeleted,
  updateServiceRows,
} from "./services.repository";

export type ListServicesParams = {
  includeDeleted?: boolean;
  categoryId?: string;
};

export type CatalogResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: CatalogFieldErrors };

function toItem(row: ServiceRow): ServiceItem {
  return {
    id: row.service_id,
    categoryId: row.category_id ?? "",
    categoryName: row.category_name ?? "",
    name: row.name ?? "",
    slug: row.slug ?? "",
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

function fail<T>(status: number, form: string): CatalogResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: CatalogFieldErrors,
): CatalogResult<T> {
  return { ok: false, status, errors };
}

export async function listServices(
  params: ListServicesParams = {},
): Promise<CatalogResult<ServiceItem[]>> {
  const rows = await listServiceRows();
  const items = rows
    .filter((r) =>
      params.includeDeleted ? true : !isDeletedFlag(r.is_deleted),
    )
    .filter((r) =>
      params.categoryId ? r.category_id === params.categoryId : true,
    )
    .map(toItem)
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { ok: true, data: items };
}

async function resolveCategory(categoryId: string) {
  const category = await findCategoryRowById(categoryId);
  if (!category) return null;
  if (isDeletedFlag(category.is_deleted)) return null;
  return category;
}

export async function createService(
  raw: CreateServiceInput,
): Promise<CatalogResult<ServiceItem>> {
  const slug = normalizeSlug(raw.slug);
  const fieldErrors = validateServiceInput({
    categoryId: raw.categoryId,
    name: raw.name.trim(),
    slug,
    description: raw.description,
    basePrice: raw.basePrice,
    priceUnit: raw.priceUnit,
    durationMin: raw.durationMin,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const category = await resolveCategory(raw.categoryId);
  if (!category) {
    return failFields(400, {
      categoryId: "Loại hình không tồn tại hoặc đang nằm trong thùng rác.",
    });
  }
  const slugOwner = await findServiceIdBySlug(slug);
  if (slugOwner) {
    return failFields(409, {
      slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
    });
  }

  const now = new Date();
  const serviceId = randomUUID();
  await insertService({
    serviceId,
    categoryId: category.category_id,
    categoryName: category.name ?? "",
    name: raw.name.trim(),
    slug,
    description: (raw.description ?? "").trim(),
    basePrice: raw.basePrice,
    priceUnit: raw.priceUnit,
    durationMin: raw.durationMin,
    isHomeSupported: raw.isHomeSupported ?? true,
    isEmergencySupported: raw.isEmergencySupported ?? false,
    isActive: raw.isActive ?? true,
    now,
  });
  const row = await findServiceRowById(serviceId);
  if (!row) return fail(500, "Không tạo được mục giá. Vui lòng thử lại.");
  return { ok: true, data: toItem(row) };
}

export async function updateService(
  serviceId: string,
  raw: UpdateServiceInput,
): Promise<CatalogResult<ServiceItem>> {
  const existing = await findServiceRowById(serviceId);
  if (!existing) return fail(404, "Không tìm thấy mục giá.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(
      400,
      "Mục giá đang nằm trong thùng rác. Hãy khôi phục trước khi sửa.",
    );
  }
  const slug = normalizeSlug(raw.slug);
  const fieldErrors = validateServiceInput({
    categoryId: raw.categoryId,
    name: raw.name.trim(),
    slug,
    description: raw.description,
    basePrice: raw.basePrice,
    priceUnit: raw.priceUnit,
    durationMin: raw.durationMin,
  });
  if (fieldErrors) return failFields(400, fieldErrors);

  const category = await resolveCategory(raw.categoryId);
  if (!category) {
    return failFields(400, {
      categoryId: "Loại hình không tồn tại hoặc đang nằm trong thùng rác.",
    });
  }
  const slugOwner = await findServiceIdBySlug(slug);
  if (slugOwner && slugOwner !== serviceId) {
    return failFields(409, {
      slug: "Slug đã tồn tại. Vui lòng chọn slug khác.",
    });
  }

  await updateServiceRows({
    serviceId,
    categoryId: category.category_id,
    categoryName: category.name ?? "",
    name: raw.name.trim(),
    slug,
    description: (raw.description ?? "").trim(),
    basePrice: raw.basePrice,
    priceUnit: raw.priceUnit,
    durationMin: raw.durationMin,
    isHomeSupported: raw.isHomeSupported ?? true,
    isEmergencySupported: raw.isEmergencySupported ?? false,
    isActive: raw.isActive ?? isActiveFlag(existing.is_active, true),
    now: new Date(),
    updatedAt: new Date(),
    oldCategoryId: existing.category_id ?? category.category_id,
    oldSlug: existing.slug ?? slug,
  });
  const row = await findServiceRowById(serviceId);
  if (!row) return fail(500, "Không cập nhật được mục giá.");
  return { ok: true, data: toItem(row) };
}

export async function toggleServiceActive(
  serviceId: string,
  isActive: boolean,
): Promise<CatalogResult<ServiceItem>> {
  const existing = await findServiceRowById(serviceId);
  if (!existing) return fail(404, "Không tìm thấy mục giá.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Mục giá đang nằm trong thùng rác, không thể bật/tắt.");
  }
  await setServiceActive(serviceId, existing.category_id ?? "", isActive);
  const row = await findServiceRowById(serviceId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toItem(row) };
}

// Soft delete hides the price row (trash, restorable). The slug pointer is
// kept so hard-delete confirmation and uniqueness still work.
export async function softDeleteService(
  serviceId: string,
): Promise<CatalogResult<ServiceItem>> {
  const existing = await findServiceRowById(serviceId);
  if (!existing) return fail(404, "Không tìm thấy mục giá.");
  if (isDeletedFlag(existing.is_deleted))
    return fail(400, "Mục giá đã nằm trong thùng rác.");
  await setServiceDeleted(
    serviceId,
    existing.category_id ?? "",
    true,
    new Date(),
  );
  const row = await findServiceRowById(serviceId);
  if (!row) return fail(500, "Không xóa được mục giá.");
  return { ok: true, data: toItem(row) };
}

export async function restoreService(
  serviceId: string,
): Promise<CatalogResult<ServiceItem>> {
  const existing = await findServiceRowById(serviceId);
  if (!existing) return fail(404, "Không tìm thấy mục giá.");
  if (!isDeletedFlag(existing.is_deleted))
    return fail(400, "Mục giá không nằm trong thùng rác.");
  const category = existing.category_id
    ? await findCategoryRowById(existing.category_id)
    : null;
  if (!category || isDeletedFlag(category.is_deleted)) {
    return fail(
      400,
      "Loại hình cha đang nằm trong thùng rác. Hãy khôi phục loại hình trước.",
    );
  }
  await setServiceDeleted(serviceId, existing.category_id ?? "", false, null);
  const row = await findServiceRowById(serviceId);
  if (!row) return fail(500, "Không khôi phục được mục giá.");
  return { ok: true, data: toItem(row) };
}

// Hard delete is permanent: all three tables lose the row. The caller must
// echo the slug back as confirm, matching the type-to-confirm dialog.
export async function hardDeleteServiceWithConfirm(
  serviceId: string,
  confirm: string,
): Promise<CatalogResult<{ id: string }>> {
  const existing = await findServiceRowById(serviceId);
  if (!existing) return fail(404, "Không tìm thấy mục giá.");
  const slug = existing.slug ?? "";
  if (normalizeSlug(confirm) !== slug) {
    return failFields(400, {
      confirm: "Mã xác nhận chưa đúng. Hãy nhập đúng slug để xóa vĩnh viễn.",
    });
  }
  await hardDeleteService(serviceId, existing.category_id ?? "", slug);
  return { ok: true, data: { id: serviceId } };
}
