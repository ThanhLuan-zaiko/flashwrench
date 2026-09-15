"use client";

import {
  FiEdit2,
  FiInbox,
  FiLoader,
  FiPower,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { CatalogPager } from "./CatalogPager";
import { formatDuration, formatVnd, PRICE_UNIT_LABELS } from "./catalog-format";
import { usePagination } from "./usePagination";

type ServicePriceListProps = {
  items: ServiceItem[];
  isPending: boolean;
  isError: boolean;
  pendingId: string | null;
  trashMode: boolean;
  categoryFilter: string;
  categoryOptions: { id: string; name: string }[];
  onFilterChange: (categoryId: string) => void;
  onEdit: (item: ServiceItem) => void;
  onToggle: (item: ServiceItem) => void;
  onSoftDelete: (item: ServiceItem) => void;
  onHardDelete: (item: ServiceItem) => void;
  onRestore: (item: ServiceItem) => void;
  onRetry: () => void;
};

function StatusPill({ item }: { item: ServiceItem }) {
  if (item.isDeleted) {
    return (
      <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        Trong thùng rác
      </span>
    );
  }
  return (
    <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
      {item.isActive ? "Đang áp dụng" : "Tạm tắt"}
    </span>
  );
}

// Live price rows grouped by current filter. Actions mirror categories:
// toggle, edit, soft delete, plus restore/hard in trash mode.
export function ServicePriceList({
  items,
  isPending,
  isError,
  pendingId,
  trashMode,
  categoryFilter,
  categoryOptions,
  onFilterChange,
  onEdit,
  onToggle,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onRetry,
}: ServicePriceListProps) {
  const pager = usePagination(items.length);
  const handleFilterChange = (categoryId: string) => {
    pager.reset();
    onFilterChange(categoryId);
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Lọc theo loại hình
        <select
          value={categoryFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:max-w-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Tất cả loại hình</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {isPending ? (
        <ul className="flex flex-col gap-2" aria-label="Đang tải bảng giá">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900"
            >
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Đang tải bảng giá…
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Không tải được bảng giá.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-6 dark:bg-zinc-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <FiInbox aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {trashMode ? "Thùng rác trống" : "Chưa có mục giá nào"}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {trashMode
                ? "Các mục xóa mềm sẽ hiện tại đây"
                : "Nhấn Thêm mục giá để tạo mới"}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {pager.slice(items).map((item) => {
              const busy = pendingId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.categoryName} · {formatVnd(item.basePrice)} ·{" "}
                      {PRICE_UNIT_LABELS[item.priceUnit]} ·{" "}
                      {formatDuration(item.durationMin)}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <StatusPill item={item} />
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        {item.slug}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {trashMode ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onRestore(item)}
                          aria-label={`Khôi phục ${item.name}`}
                          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <FiRotateCcw
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Khôi phục
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onHardDelete(item)}
                          aria-label={`Xóa vĩnh viễn ${item.name}`}
                          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          <FiTrash2
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Xóa cứng
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onToggle(item)}
                          aria-label={
                            item.isActive
                              ? `Tạm tắt ${item.name}`
                              : `Bật lại ${item.name}`
                          }
                          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <FiPower aria-hidden="true" className="h-3.5 w-3.5" />
                          {item.isActive ? "Tạm tắt" : "Bật lại"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(item)}
                          aria-label={`Sửa ${item.name}`}
                          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <FiEdit2 aria-hidden="true" className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSoftDelete(item)}
                          aria-label={`Xóa mềm ${item.name}`}
                          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <FiTrash2
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Xóa mềm
                        </button>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <CatalogPager
            page={pager.page}
            pageCount={pager.pageCount}
            start={pager.range.start}
            end={pager.range.end}
            total={items.length}
            onPage={pager.goTo}
          />
        </div>
      )}
    </div>
  );
}
