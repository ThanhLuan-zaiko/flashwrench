import { normalizeSlug } from "@/lib/catalog/catalog-validation";
import { pruneOwnerAssets } from "@/lib/media/media.service";
import { findPartCategoryRowById } from "./part-categories.repository";
import { toPartItem } from "./parts.mapper";
import { findPartRowById } from "./parts.repository";
import {
  isDeletedFlag,
  type PartItem,
  type PartRow,
  type PartsFieldErrors,
  type PartsResult,
} from "./parts.types";
import {
  decrementPartStockCas,
  hardDeletePart,
  setPartActive,
  setPartDeleted,
  setPartSoldCount,
  setPartStock,
} from "./parts-inventory.repository";

// Status, trash and stock flows for parts. Split from parts.service.ts
// (create/update) so both files stay under the line limit.

function fail<T>(status: number, form: string): PartsResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: PartsFieldErrors,
): PartsResult<T> {
  return { ok: false, status, errors };
}

export async function togglePartActive(
  partId: string,
  isActive: boolean,
): Promise<PartsResult<PartItem>> {
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Sản phẩm đang nằm trong thùng rác, không thể bật/tắt.");
  }
  await setPartActive(
    partId,
    existing.category_id ?? "",
    existing.created_at,
    isActive,
    new Date(),
  );
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toPartItem(row) };
}

export async function softDeletePart(
  partId: string,
): Promise<PartsResult<PartItem>> {
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Sản phẩm đã nằm trong thùng rác.");
  }
  await applyDeleted(existing, true, new Date());
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không xóa được sản phẩm.");
  return { ok: true, data: toPartItem(row) };
}

export async function restorePart(
  partId: string,
): Promise<PartsResult<PartItem>> {
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  if (!isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Sản phẩm không nằm trong thùng rác.");
  }
  const category = existing.category_id
    ? await findPartCategoryRowById(existing.category_id)
    : null;
  if (!category || isDeletedFlag(category.is_deleted)) {
    return fail(
      400,
      "Danh mục cha không còn hoặc đang nằm trong thùng rác. Hãy khôi phục danh mục trước.",
    );
  }
  await applyDeleted(existing, false, null);
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không khôi phục được sản phẩm.");
  return { ok: true, data: toPartItem(row) };
}

async function applyDeleted(
  existing: PartRow,
  isDeleted: boolean,
  deletedAt: Date | null,
): Promise<void> {
  await setPartDeleted(
    existing.part_id,
    existing.category_id ?? "",
    existing.created_at,
    existing.brand ?? "",
    isDeleted,
    deletedAt,
    new Date(),
  );
}

// Staff stock adjustment (dispatcher + admin): absolute quantity write,
// mirrored into the category read model. Checkout uses CAS instead.
export async function adjustPartStock(
  partId: string,
  stockQty: number,
): Promise<PartsResult<PartItem>> {
  if (!Number.isInteger(stockQty) || stockQty < 0 || stockQty > 1_000_000) {
    return failFields(400, {
      stock: "Tồn kho phải là số nguyên từ 0 đến 1.000.000.",
    });
  }
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Sản phẩm đang nằm trong thùng rác.");
  }
  await setPartStock(
    partId,
    existing.category_id ?? "",
    existing.created_at,
    stockQty,
    new Date(),
  );
  const row = await findPartRowById(partId);
  if (!row) return fail(500, "Không cập nhật được tồn kho.");
  return { ok: true, data: toPartItem(row) };
}

// Checkout path: read-modify-write guarded by a compare-and-set on the
// exact value just read. Retries a few times to absorb concurrent orders.
export async function decrementStockForOrder(
  partId: string,
  qty: number,
): Promise<"ok" | "insufficient" | "missing"> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await findPartRowById(partId);
    if (!row) return "missing";
    const current = row.stock_qty ?? 0;
    if (current < qty) return "insufficient";
    if (await decrementPartStockCas(partId, current, current - qty)) {
      // Best effort stats; a stale read here only skews sold_count.
      await setPartSoldCount(partId, (row.sold_count ?? 0) + qty).catch(
        () => undefined,
      );
      return "ok";
    }
  }
  return "insufficient";
}

// Restore stock after a cancelled order (plain write: the cancel path has
// no contention worth a CAS loop). sold_count never drops below zero.
export async function restockForOrder(
  partId: string,
  qty: number,
): Promise<void> {
  const row = await findPartRowById(partId);
  if (!row) return;
  await setPartStock(
    partId,
    row.category_id ?? "",
    row.created_at,
    (row.stock_qty ?? 0) + qty,
    new Date(),
  );
  const sold = Math.max(0, (row.sold_count ?? 0) - qty);
  await setPartSoldCount(partId, sold).catch(() => undefined);
}

// Hard delete is permanent: main row, read models and both unique
// pointers go away. The caller echoes the slug back as confirm.
export async function hardDeletePartWithConfirm(
  partId: string,
  confirm: string,
): Promise<PartsResult<{ id: string }>> {
  const existing = await findPartRowById(partId);
  if (!existing) return fail(404, "Không tìm thấy sản phẩm.");
  const slug = existing.slug ?? "";
  if (normalizeSlug(confirm) !== slug) {
    return failFields(400, {
      confirm: "Mã xác nhận chưa đúng. Hãy nhập đúng slug để xóa vĩnh viễn.",
    });
  }
  await hardDeletePart({
    partId,
    slug,
    sku: existing.sku ?? "",
    categoryId: existing.category_id ?? "",
    brand: existing.brand ?? "",
    createdAt: existing.created_at,
  });
  await pruneOwnerAssets("part", partId, []).catch(() => undefined);
  return { ok: true, data: { id: partId } };
}
