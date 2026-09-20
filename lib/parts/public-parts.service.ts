import {
  findPartCategoryRowById,
  listPartCategoryRows,
} from "./part-categories.repository";
import { toPartCategoryItem, toPartItem } from "./parts.mapper";
import {
  findPartIdBySlug,
  findPartRowById,
  listPartRows,
} from "./parts.repository";
import {
  isActiveFlag,
  isDeletedFlag,
  type PartCategoryItem,
  type PartItem,
  type PartsResult,
} from "./parts.types";

export type PublicPartsCatalog = {
  categories: PartCategoryItem[];
  parts: PartItem[];
};

function ok<T>(data: T): PartsResult<T> {
  return { ok: true, data };
}

// Public /products landing data: active, non-deleted categories and parts
// only. A part whose parent category is hidden or trashed stays hidden so
// the storefront never shows orphan products.
export async function listPublicParts(): Promise<
  PartsResult<PublicPartsCatalog>
> {
  const [categoryRows, partRows] = await Promise.all([
    listPartCategoryRows(),
    listPartRows(),
  ]);
  const liveCategoryIds = new Set(
    categoryRows
      .filter((c) => isActiveFlag(c.is_active) && !isDeletedFlag(c.is_deleted))
      .map((c) => c.category_id),
  );
  const counts = new Map<string, number>();
  const parts = partRows
    .filter(
      (p) =>
        isActiveFlag(p.is_active) &&
        !isDeletedFlag(p.is_deleted) &&
        p.category_id !== null &&
        liveCategoryIds.has(p.category_id),
    )
    .map(toPartItem)
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  for (const part of parts) {
    counts.set(part.categoryId, (counts.get(part.categoryId) ?? 0) + 1);
  }
  const categories = categoryRows
    .filter((c) => liveCategoryIds.has(c.category_id))
    .map((c) => toPartCategoryItem(c, counts.get(c.category_id) ?? 0))
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"),
    );
  return ok({ categories, parts });
}

// Product detail by slug. The pointer table resolves the id, then the
// main row must still pass the public visibility rules above.
export async function getPublicPartBySlug(
  slug: string,
): Promise<PartsResult<PartItem>> {
  const partId = await findPartIdBySlug(slug);
  if (!partId) {
    return { ok: false, status: 404, errors: { form: "not-found" } };
  }
  const row = await findPartRowById(partId);
  if (!row || !isActiveFlag(row.is_active) || isDeletedFlag(row.is_deleted)) {
    return { ok: false, status: 404, errors: { form: "not-found" } };
  }
  if (row.category_id) {
    const parent = await findPartCategoryRowById(row.category_id);
    if (
      !parent ||
      !isActiveFlag(parent.is_active) ||
      isDeletedFlag(parent.is_deleted)
    ) {
      return { ok: false, status: 404, errors: { form: "not-found" } };
    }
  }
  return ok(toPartItem(row));
}
