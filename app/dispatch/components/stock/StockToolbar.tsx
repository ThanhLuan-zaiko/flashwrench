"use client";

import { useId } from "react";
import { FiLayers, FiPackage, FiSearch, FiX } from "react-icons/fi";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import {
  isStockFilterActive,
  type StockCategoryOption,
  type StockFilter,
  type StockLevel,
} from "./stock-filters";

type StockToolbarProps = {
  filter: StockFilter;
  categories: StockCategoryOption[];
  onChange: (next: StockFilter) => void;
  onReset: () => void;
};

const LEVEL_OPTIONS: { value: StockLevel; label: string }[] = [
  { value: "all", label: "Mọi mức tồn" },
  { value: "in", label: "Còn hàng" },
  { value: "low", label: "Sắp hết (≤ 5)" },
  { value: "out", label: "Hết hàng" },
];

// Search + category + stock-level filters for the inventory list. Purely
// controlled: StockBoard owns the state and resets the page on each change.
export function StockToolbar({
  filter,
  categories,
  onChange,
  onReset,
}: StockToolbarProps) {
  const active = isStockFilterActive(filter);
  const searchId = useId();

  return (
    <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label
          htmlFor={searchId}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Tìm kiếm
        </label>
        <div className="relative mt-1.5">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            id={searchId}
            type="search"
            value={filter.query}
            onChange={(e) => onChange({ ...filter, query: e.target.value })}
            placeholder="Tìm theo tên, SKU hoặc hãng…"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-3 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SelectDropdown
          label="Danh mục"
          value={filter.categoryId}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(categoryId) => onChange({ ...filter, categoryId })}
          allLabel="Tất cả danh mục"
          listLabel="Chọn danh mục"
          searchPlaceholder="Tìm danh mục…"
          unitName="danh mục"
          emptyTitle="Không tìm thấy danh mục phù hợp"
          icon={FiLayers}
          className="relative w-full sm:w-56"
        />
        <SelectDropdown
          label="Mức tồn"
          value={filter.level}
          options={LEVEL_OPTIONS}
          onChange={(level) =>
            onChange({ ...filter, level: level as StockLevel })
          }
          listLabel="Chọn mức tồn kho"
          icon={FiPackage}
          className="relative w-full sm:w-44"
        />
        {active && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border border-zinc-300 px-3 text-xs font-semibold text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-4 w-4" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}
