"use client";

import { FiInbox, FiLayers, FiLoader } from "react-icons/fi";
import type { PartItem } from "@/lib/parts/parts.types";
import { CatalogPager } from "../services/CatalogPager";
import { formatVnd } from "../services/catalog-format";
import { SelectDropdown } from "../services/SelectDropdown";
import { usePagination } from "../services/usePagination";
import { PartRowActions } from "./PartRowActions";

type PartListProps = {
  items: PartItem[];
  isPending: boolean;
  isError: boolean;
  pendingId: string | null;
  trashMode: boolean;
  categoryFilter: string;
  categoryOptions: { id: string; name: string }[];
  onFilterChange: (categoryId: string) => void;
  onEdit: (item: PartItem) => void;
  onToggle: (item: PartItem) => void;
  onSoftDelete: (item: PartItem) => void;
  onHardDelete: (item: PartItem) => void;
  onRestore: (item: PartItem) => void;
  onRetry: () => void;
};

function StatusPill({ item }: { item: PartItem }) {
  return (
    <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
      {item.isDeleted
        ? "Trong thùng rác"
        : item.isActive
          ? "Đang bán"
          : "Tạm tắt"}
    </span>
  );
}

// Live part rows with price/stock info plus CRUD actions.
export function PartList({
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
}: PartListProps) {
  const pager = usePagination(items.length);
  const handleFilterChange = (categoryId: string) => {
    pager.reset();
    onFilterChange(categoryId);
  };
  return (
    <div className="flex flex-col gap-3">
      {!trashMode && (
        <SelectDropdown
          label="Lọc theo danh mục"
          value={categoryFilter}
          options={categoryOptions.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
          onChange={handleFilterChange}
          allLabel="Tất cả danh mục"
          listLabel="Chọn danh mục"
          searchPlaceholder="Tìm danh mục…"
          unitName="danh mục"
          emptyTitle="Không tìm thấy danh mục phù hợp"
          icon={FiLayers}
          className="relative w-full sm:max-w-xs"
        />
      )}

      {isPending ? (
        <ul className="flex flex-col gap-2" aria-label="Đang tải sản phẩm">
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
                Đang tải sản phẩm…
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Không tải được sản phẩm.
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
              {trashMode ? "Thùng rác trống" : "Chưa có sản phẩm nào"}
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              {trashMode
                ? "Các sản phẩm xóa mềm sẽ hiện tại đây"
                : "Nhấn Thêm sản phẩm để tạo mới"}
            </span>
          </span>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {pager.slice(items).map((item) => {
              const busy = pendingId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    {item.imageUrl ? (
                      // biome-ignore lint/performance/noImgElement: admin thumbnails served immutable from the media store.
                      <img
                        src={item.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {item.name}
                      </span>
                      <span className="block truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {item.sku} · {item.brand || "—"} ·{" "}
                        {formatVnd(item.price)} · kho {item.stockQty}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <StatusPill item={item} />
                        <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                          {item.categoryName}
                        </span>
                      </span>
                    </span>
                  </span>
                  <PartRowActions
                    item={item}
                    busy={busy}
                    trashMode={trashMode}
                    onEdit={onEdit}
                    onToggle={onToggle}
                    onSoftDelete={onSoftDelete}
                    onHardDelete={onHardDelete}
                    onRestore={onRestore}
                  />
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
        </>
      )}
    </div>
  );
}
