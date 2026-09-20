"use client";

import Link from "next/link";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../bento/BentoCard";
import { ServicesStatCard } from "../bento/ServicesStatCard";
import {
  PartCategoryDialog,
  type PartCategoryDialogState,
} from "./PartCategoryDialog";
import { PartCategoryList } from "./PartCategoryList";
import { PartDeleteDialog } from "./PartDeleteDialog";
import { PartDialog, type PartDialogState } from "./PartDialog";
import { PartList } from "./PartList";
import { ProductsTrashPanel } from "./ProductsTrashPanel";
import { PRODUCT_TABS, type ProductTab } from "./product-tabs";
import { useProductRowActions } from "./useProductRowActions";
import { useProductsOverview } from "./useProductsOverview";

// Bento root for the parts catalog: live stats, tabbed CRUD, trash
// restore. Data via useProductsOverview, mutations via
// useProductRowActions. Active tab comes from the route (one URL per tab)
// so links stay shareable and the browser back button works.
export function ProductsSection({ tab }: { tab: ProductTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryDialog, setCategoryDialog] =
    useState<PartCategoryDialogState | null>(null);
  const [partDialog, setPartDialog] = useState<PartDialogState | null>(null);
  const actions = useProductRowActions();
  const overview = useProductsOverview(categoryFilter);

  const categoryKey =
    categoryDialog?.mode === "edit" ? categoryDialog.item.id : "create";
  const partKey =
    partDialog?.mode === "edit"
      ? partDialog.item.id
      : (partDialog?.presetCategoryId ?? "create");

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Quản lý sản phẩm"
        title="Linh kiện rõ, kho gọn."
        subtitle="Quản lý danh mục và sản phẩm đang bán cho khách hàng trên toàn hệ thống."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {overview.stats.map((stat) => (
          <ServicesStatCard key={stat.id} stat={stat} />
        ))}
        <BentoCard
          label="Quản lý cửa hàng"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Chọn nhóm quản lý"
              className="flex flex-wrap gap-1.5"
            >
              {PRODUCT_TABS.map((t) => {
                const TabIcon = t.icon;
                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    scroll={false}
                    prefetch
                    role="tab"
                    aria-selected={tab === t.id}
                    aria-current={tab === t.id ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                      tab === t.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <TabIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {t.label}
                  </Link>
                );
              })}
            </div>
            {tab !== "trash" ? (
              <button
                type="button"
                onClick={() =>
                  tab === "categories"
                    ? setCategoryDialog({ mode: "create" })
                    : setPartDialog({
                        mode: "create",
                        presetCategoryId: categoryFilter,
                      })
                }
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <FiPlus aria-hidden="true" className="h-4 w-4" />
                {tab === "categories" ? "Thêm danh mục" : "Thêm sản phẩm"}
              </button>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <FiTrash2 aria-hidden="true" className="h-4 w-4" />
                Khôi phục hoặc xóa vĩnh viễn
              </p>
            )}
          </div>

          <div role="tabpanel" className="mt-4">
            {tab === "categories" && (
              <PartCategoryList
                items={overview.liveCategories}
                isPending={overview.categoriesQuery.isPending}
                isError={overview.categoriesQuery.isError}
                pendingId={actions.pendingId}
                trashMode={false}
                onEdit={(item) => setCategoryDialog({ mode: "edit", item })}
                onToggle={actions.toggleCategory}
                onSoftDelete={(item) => actions.openSoft("category", item)}
                onHardDelete={(item) => actions.openHard("category", item)}
                onRestore={actions.restoreCategory}
                onRetry={() => void overview.categoriesQuery.refetch()}
              />
            )}
            {tab === "parts" && (
              <PartList
                items={overview.visibleParts}
                isPending={overview.partsQuery.isPending}
                isError={overview.partsQuery.isError}
                pendingId={actions.pendingId}
                trashMode={false}
                categoryFilter={categoryFilter}
                categoryOptions={overview.liveCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                }))}
                onFilterChange={setCategoryFilter}
                onEdit={(item) => setPartDialog({ mode: "edit", item })}
                onToggle={actions.togglePart}
                onSoftDelete={(item) => actions.openSoft("part", item)}
                onHardDelete={(item) => actions.openHard("part", item)}
                onRestore={actions.restorePart}
                onRetry={() => void overview.partsQuery.refetch()}
              />
            )}
            {tab === "trash" && (
              <ProductsTrashPanel
                trashCategories={overview.trashCategories}
                trashParts={overview.trashParts}
                categoriesPending={overview.categoriesQuery.isPending}
                categoriesError={overview.categoriesQuery.isError}
                partsPending={overview.partsQuery.isPending}
                partsError={overview.partsQuery.isError}
                pendingId={actions.pendingId}
                onEditCategory={(item) =>
                  setCategoryDialog({ mode: "edit", item })
                }
                onToggleCategory={actions.toggleCategory}
                onSoftCategory={(item) => actions.openSoft("category", item)}
                onHardCategory={(item) => actions.openHard("category", item)}
                onRestoreCategory={actions.restoreCategory}
                onRetryCategories={() =>
                  void overview.categoriesQuery.refetch()
                }
                onEditPart={(item) => setPartDialog({ mode: "edit", item })}
                onTogglePart={actions.togglePart}
                onSoftPart={(item) => actions.openSoft("part", item)}
                onHardPart={(item) => actions.openHard("part", item)}
                onRestorePart={actions.restorePart}
                onRetryParts={() => void overview.partsQuery.refetch()}
              />
            )}
          </div>
        </BentoCard>
      </div>

      {categoryDialog && (
        <PartCategoryDialog
          key={`category-${categoryKey}`}
          dialog={categoryDialog}
          onClose={() => setCategoryDialog(null)}
        />
      )}
      {partDialog && (
        <PartDialog
          key={`part-${partKey}`}
          dialog={partDialog}
          categories={overview.liveCategories}
          onClose={() => setPartDialog(null)}
        />
      )}
      <PartDeleteDialog
        target={actions.deleteTarget}
        confirmText={actions.confirmText}
        pending={actions.deletePending}
        error={actions.deleteError}
        onConfirmText={actions.setConfirmText}
        onClose={actions.closeDelete}
        onConfirm={actions.confirmDelete}
      />
    </div>
  );
}
