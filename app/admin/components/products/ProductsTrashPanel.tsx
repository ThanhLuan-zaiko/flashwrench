"use client";

import type { PartCategoryItem, PartItem } from "@/lib/parts/parts.types";
import { PartCategoryList } from "./PartCategoryList";
import { PartList } from "./PartList";

type ProductsTrashPanelProps = {
  trashCategories: PartCategoryItem[];
  trashParts: PartItem[];
  categoriesPending: boolean;
  categoriesError: boolean;
  partsPending: boolean;
  partsError: boolean;
  pendingId: string | null;
  onEditCategory: (item: PartCategoryItem) => void;
  onToggleCategory: (item: PartCategoryItem) => void;
  onSoftCategory: (item: PartCategoryItem) => void;
  onHardCategory: (item: PartCategoryItem) => void;
  onRestoreCategory: (item: PartCategoryItem) => void;
  onRetryCategories: () => void;
  onEditPart: (item: PartItem) => void;
  onTogglePart: (item: PartItem) => void;
  onSoftPart: (item: PartItem) => void;
  onHardPart: (item: PartItem) => void;
  onRestorePart: (item: PartItem) => void;
  onRetryParts: () => void;
};

// Trash tab content: soft-deleted categories plus parts with restore and
// type-to-confirm hard delete.
export function ProductsTrashPanel({
  trashCategories,
  trashParts,
  categoriesPending,
  categoriesError,
  partsPending,
  partsError,
  pendingId,
  onEditCategory,
  onToggleCategory,
  onSoftCategory,
  onHardCategory,
  onRestoreCategory,
  onRetryCategories,
  onEditPart,
  onTogglePart,
  onSoftPart,
  onHardPart,
  onRestorePart,
  onRetryParts,
}: ProductsTrashPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Danh mục trong thùng rác">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Danh mục đã xóa mềm ({trashCategories.length})
        </h3>
        <div className="mt-2">
          <PartCategoryList
            items={trashCategories}
            isPending={categoriesPending}
            isError={categoriesError}
            pendingId={pendingId}
            trashMode
            onEdit={onEditCategory}
            onToggle={onToggleCategory}
            onSoftDelete={onSoftCategory}
            onHardDelete={onHardCategory}
            onRestore={onRestoreCategory}
            onRetry={onRetryCategories}
          />
        </div>
      </section>
      <section aria-label="Sản phẩm trong thùng rác">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Sản phẩm đã xóa mềm ({trashParts.length})
        </h3>
        <div className="mt-2">
          <PartList
            items={trashParts}
            isPending={partsPending}
            isError={partsError}
            pendingId={pendingId}
            trashMode
            categoryFilter=""
            categoryOptions={[]}
            onFilterChange={() => undefined}
            onEdit={onEditPart}
            onToggle={onTogglePart}
            onSoftDelete={onSoftPart}
            onHardDelete={onHardPart}
            onRestore={onRestorePart}
            onRetry={onRetryParts}
          />
        </div>
      </section>
    </div>
  );
}
