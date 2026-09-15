"use client";

import type {
  ServiceCategoryItem,
  ServiceItem,
} from "@/lib/catalog/service-catalog.types";
import { ServiceCategoryList } from "./ServiceCategoryList";
import { ServicePriceList } from "./ServicePriceList";

type CatalogTrashPanelProps = {
  trashCategories: ServiceCategoryItem[];
  trashServices: ServiceItem[];
  categoriesPending: boolean;
  categoriesError: boolean;
  servicesPending: boolean;
  servicesError: boolean;
  pendingId: string | null;
  onEditCategory: (item: ServiceCategoryItem) => void;
  onToggleCategory: (item: ServiceCategoryItem) => void;
  onSoftCategory: (item: ServiceCategoryItem) => void;
  onHardCategory: (item: ServiceCategoryItem) => void;
  onRestoreCategory: (item: ServiceCategoryItem) => void;
  onRetryCategories: () => void;
  onEditService: (item: ServiceItem) => void;
  onToggleService: (item: ServiceItem) => void;
  onSoftService: (item: ServiceItem) => void;
  onHardService: (item: ServiceItem) => void;
  onRestoreService: (item: ServiceItem) => void;
  onRetryServices: () => void;
};

// Trash tab content: soft-deleted categories plus services with restore
// and type-to-confirm hard delete. Extracted to keep the section small.
export function CatalogTrashPanel({
  trashCategories,
  trashServices,
  categoriesPending,
  categoriesError,
  servicesPending,
  servicesError,
  pendingId,
  onEditCategory,
  onToggleCategory,
  onSoftCategory,
  onHardCategory,
  onRestoreCategory,
  onRetryCategories,
  onEditService,
  onToggleService,
  onSoftService,
  onHardService,
  onRestoreService,
  onRetryServices,
}: CatalogTrashPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Loại hình trong thùng rác">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Loại hình đã xóa mềm ({trashCategories.length})
        </h3>
        <div className="mt-2">
          <ServiceCategoryList
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
      <section aria-label="Bảng giá trong thùng rác">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Bảng giá đã xóa mềm ({trashServices.length})
        </h3>
        <div className="mt-2">
          <ServicePriceList
            items={trashServices}
            isPending={servicesPending}
            isError={servicesError}
            pendingId={pendingId}
            trashMode
            categoryFilter=""
            categoryOptions={[]}
            onFilterChange={() => undefined}
            onEdit={onEditService}
            onToggle={onToggleService}
            onSoftDelete={onSoftService}
            onHardDelete={onHardService}
            onRestore={onRestoreService}
            onRetry={onRetryServices}
          />
        </div>
      </section>
    </div>
  );
}
