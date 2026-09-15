"use client";

import {
  FiEdit2,
  FiInbox,
  FiLoader,
  FiPower,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { CatalogPager } from "./CatalogPager";
import { usePagination } from "./usePagination";

type ServiceCategoryListProps = {
  items: ServiceCategoryItem[];
  isPending: boolean;
  isError: boolean;
  pendingId: string | null;
  trashMode: boolean;
  onEdit: (item: ServiceCategoryItem) => void;
  onToggle: (item: ServiceCategoryItem) => void;
  onSoftDelete: (item: ServiceCategoryItem) => void;
  onHardDelete: (item: ServiceCategoryItem) => void;
  onRestore: (item: ServiceCategoryItem) => void;
  onRetry: () => void;
};

function StatusPill({ item }: { item: ServiceCategoryItem }) {
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

// Live category rows with full CRUD actions. Touch targets stay >= 44px.
export function ServiceCategoryList({
  items,
  isPending,
  isError,
  pendingId,
  trashMode,
  onEdit,
  onToggle,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onRetry,
}: ServiceCategoryListProps) {
  const pager = usePagination(items.length);
  if (isPending) {
    return (
      <ul className="flex flex-col gap-2" aria-label="Đang tải loại hình">
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
              Đang tải loại hình…
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (isError) {
    return (
      <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Không tải được loại hình.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-6 dark:bg-zinc-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <FiInbox aria-hidden="true" className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {trashMode ? "Thùng rác trống" : "Chưa có loại hình nào"}
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            {trashMode
              ? "Các mục xóa mềm sẽ hiện tại đây"
              : "Nhấn Thêm loại hình để tạo mới"}
          </span>
        </span>
      </div>
    );
  }
  return (
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
                <span className="block truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {item.slug} · {item.serviceCount} mục giá
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusPill item={item} />
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
                      <FiRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                      Khôi phục
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onHardDelete(item)}
                      aria-label={`Xóa vĩnh viễn ${item.name}`}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
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
                      <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
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
  );
}
