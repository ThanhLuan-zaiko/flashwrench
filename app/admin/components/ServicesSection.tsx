"use client";

import Link from "next/link";
import { useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "./bento/BentoCard";
import { ServicesStatCard } from "./bento/ServicesStatCard";
import { CatalogDeleteDialog } from "./services/CatalogDeleteDialog";
import { CatalogTrashPanel } from "./services/CatalogTrashPanel";
import { CATALOG_TABS, type CatalogTab } from "./services/catalog-tabs";
import {
  type CategoryDialogState,
  ServiceCategoryDialog,
} from "./services/ServiceCategoryDialog";
import { ServiceCategoryList } from "./services/ServiceCategoryList";
import {
  type ServiceDialogState,
  ServiceItemDialog,
} from "./services/ServiceItemDialog";
import { ServicePriceList } from "./services/ServicePriceList";
import { useCatalogOverview } from "./services/useCatalogOverview";
import { useCatalogRowActions } from "./services/useCatalogRowActions";

// Bento root for service config: live stats, tabbed CRUD, trash restore.
// Data via useCatalogOverview, mutations via useCatalogRowActions.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works.
export function ServicesSection({ tab }: { tab: CatalogTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryDialog, setCategoryDialog] =
    useState<CategoryDialogState | null>(null);
  const [serviceDialog, setServiceDialog] = useState<ServiceDialogState | null>(
    null,
  );
  const actions = useCatalogRowActions();
  const overview = useCatalogOverview(categoryFilter);

  const categoryKey =
    categoryDialog?.mode === "edit" ? categoryDialog.item.id : "create";
  const serviceKey =
    serviceDialog?.mode === "edit"
      ? serviceDialog.item.id
      : (serviceDialog?.presetCategoryId ?? "create");

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Cấu hình dịch vụ"
        title="Giá rõ, bật tắt gọn."
        subtitle="Quản lý loại hình sửa chữa và bảng giá áp dụng cho khách hàng trên toàn hệ thống."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {overview.stats.map((stat) => (
          <ServicesStatCard key={stat.id} stat={stat} />
        ))}
        <BentoCard
          label="Quản lý danh mục"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Chọn nhóm quản lý"
              className="flex flex-wrap gap-1.5"
            >
              {CATALOG_TABS.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                    tab === t.id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            {tab !== "trash" ? (
              <button
                type="button"
                onClick={() =>
                  tab === "categories"
                    ? setCategoryDialog({ mode: "create" })
                    : setServiceDialog({
                        mode: "create",
                        presetCategoryId: categoryFilter,
                      })
                }
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <FiPlus aria-hidden="true" className="h-4 w-4" />
                {tab === "categories" ? "Thêm loại hình" : "Thêm mục giá"}
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
              <ServiceCategoryList
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
            {tab === "prices" && (
              <ServicePriceList
                items={overview.visibleServices}
                isPending={overview.servicesQuery.isPending}
                isError={overview.servicesQuery.isError}
                pendingId={actions.pendingId}
                trashMode={false}
                categoryFilter={categoryFilter}
                categoryOptions={overview.liveCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                }))}
                onFilterChange={setCategoryFilter}
                onEdit={(item) => setServiceDialog({ mode: "edit", item })}
                onToggle={actions.toggleService}
                onSoftDelete={(item) => actions.openSoft("service", item)}
                onHardDelete={(item) => actions.openHard("service", item)}
                onRestore={actions.restoreService}
                onRetry={() => void overview.servicesQuery.refetch()}
              />
            )}
            {tab === "trash" && (
              <CatalogTrashPanel
                trashCategories={overview.trashCategories}
                trashServices={overview.trashServices}
                categoriesPending={overview.categoriesQuery.isPending}
                categoriesError={overview.categoriesQuery.isError}
                servicesPending={overview.servicesQuery.isPending}
                servicesError={overview.servicesQuery.isError}
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
                onEditService={(item) =>
                  setServiceDialog({ mode: "edit", item })
                }
                onToggleService={actions.toggleService}
                onSoftService={(item) => actions.openSoft("service", item)}
                onHardService={(item) => actions.openHard("service", item)}
                onRestoreService={actions.restoreService}
                onRetryServices={() => void overview.servicesQuery.refetch()}
              />
            )}
          </div>
        </BentoCard>
      </div>

      {categoryDialog && (
        <ServiceCategoryDialog
          key={`category-${categoryKey}`}
          dialog={categoryDialog}
          onClose={() => setCategoryDialog(null)}
        />
      )}
      {serviceDialog && (
        <ServiceItemDialog
          key={`service-${serviceKey}`}
          dialog={serviceDialog}
          categories={overview.liveCategories}
          onClose={() => setServiceDialog(null)}
        />
      )}
      <CatalogDeleteDialog
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
