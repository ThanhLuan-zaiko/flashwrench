"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiAlertCircle, FiLoader, FiRefreshCw } from "react-icons/fi";
import { useDispatchParts } from "@/hooks/dispatch-orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { StockPager } from "./StockPager";
import { StockPanel } from "./StockPanel";
import { StockToolbar } from "./StockToolbar";
import {
  EMPTY_STOCK_FILTER,
  filterStockParts,
  isStockFilterActive,
  type StockFilter,
  stockCategoryOptions,
} from "./stock-filters";
import { clampPage, pageSlice, stockPageCount } from "./stock-pager";

// Standalone stock console: the parts list is dev-scale (the repo does an
// intentional full scan), so paging happens client-side — numbered pages,
// instant flips, and one fetch shared with the POS part picker cache.
export function StockBoard() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const router = useRouter();
  const { page, firstPageHref, hrefFor } = useRoutePage();
  const [filter, setFilter] = useState<StockFilter>(EMPTY_STOCK_FILTER);
  const query = useDispatchParts();
  const items = (query.data?.parts ?? []).filter((p) => !p.isDeleted);
  // Any filter change goes back to page 1 so the list never sits on a page
  // that no longer exists under the narrowed result set — the hop back is
  // a URL replace so the dropped page segment stays consistent.
  const applyFilter = (next: StockFilter) => {
    setFilter(next);
    if (page > 1) router.replace(firstPageHref, { scroll: false });
  };
  const filtered = filterStockParts(items, filter);
  const slice = pageSlice(filtered, page);
  const totalPages = stockPageCount(filtered.length);
  const filtering = isStockFilterActive(filter);
  // A typed /page/N beyond the last page rewrites itself once the
  // (filtered) list length is known.
  useCanonicalizePage(totalPages, query.isSuccess);

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <BentoCard label="Tồn kho linh kiện">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
                Kiểm kê và điều chỉnh tồn kho
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Đặt số lượng tuyệt đối cho từng linh kiện sau kiểm kê hoặc nhập
                hàng. Sửa giá/danh mục nằm ở trang quản trị.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiRefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${query.isFetching ? "motion-safe:animate-spin" : ""}`}
              />
              Tải lại
            </button>
          </div>
        </BentoCard>

        <BentoCard label="Danh sách linh kiện">
          {query.isPending && (
            <div
              className="mt-2 flex items-center justify-center py-8"
              aria-live="polite"
              aria-busy="true"
            >
              <FiLoader
                aria-hidden="true"
                className="h-8 w-8 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
              />
              <span className="sr-only">Đang tải tồn kho</span>
            </div>
          )}
          {query.isError && (
            <div className="mt-2 flex flex-col items-center py-8 text-center">
              <FiAlertCircle
                aria-hidden="true"
                className="h-8 w-8 text-zinc-400"
              />
              <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Không tải được tồn kho.
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-3 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Thử lại
              </button>
            </div>
          )}
          {query.isSuccess && items.length > 0 && (
            <StockToolbar
              filter={filter}
              categories={stockCategoryOptions(items)}
              onChange={applyFilter}
              onReset={() => applyFilter(EMPTY_STOCK_FILTER)}
            />
          )}
          {query.isSuccess && items.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Chưa có sản phẩm nào trong kho.
            </p>
          )}
          {query.isSuccess && items.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Không có linh kiện nào khớp bộ lọc — thử từ khóa khác hoặc xóa
              lọc.
            </p>
          )}
          {filtered.length > 0 && <StockPanel items={slice.items} />}
          <StockPager
            page={clampPage(page, filtered.length)}
            totalPages={totalPages}
            from={slice.from}
            to={slice.to}
            total={filtered.length}
            hrefFor={hrefFor}
          />
          {filtering && filtered.length > 0 && (
            <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {filtered.length}/{items.length} linh kiện khớp bộ lọc.
            </p>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
