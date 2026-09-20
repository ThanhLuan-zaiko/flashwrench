"use client";

import { fieldError } from "../services/catalog-errors";

type PartPricingFieldsProps = {
  price: string;
  comparePrice: string;
  stockQty: string;
  isActive: boolean;
  error: unknown;
  onPrice: (value: string) => void;
  onComparePrice: (value: string) => void;
  onStockQty: (value: string) => void;
  onActive: (value: boolean) => void;
};

const INPUT_CLASSES =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const LABEL_CLASSES =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

// Price, compare-at price and stock inputs for the part dialog.
export function PartPricingFields({
  price,
  comparePrice,
  stockQty,
  isActive,
  error,
  onPrice,
  onComparePrice,
  onStockQty,
  onActive,
}: PartPricingFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className={LABEL_CLASSES}>
          Giá bán (VND)
          <input
            value={price}
            onChange={(e) => onPrice(e.target.value)}
            inputMode="numeric"
            placeholder="150000"
            className={INPUT_CLASSES}
          />
          {fieldError(error, "price") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "price")}
            </span>
          )}
        </label>
        <label className={LABEL_CLASSES}>
          Giá gốc (VND, không bắt buộc)
          <input
            value={comparePrice}
            onChange={(e) => onComparePrice(e.target.value)}
            inputMode="numeric"
            placeholder="200000"
            className={INPUT_CLASSES}
          />
          {fieldError(error, "comparePrice") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "comparePrice")}
            </span>
          )}
        </label>
        <label className={LABEL_CLASSES}>
          Tồn kho
          <input
            value={stockQty}
            onChange={(e) => onStockQty(e.target.value)}
            inputMode="numeric"
            placeholder="10"
            className={INPUT_CLASSES}
          />
          {fieldError(error, "stockQty") && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {fieldError(error, "stockQty")}
            </span>
          )}
        </label>
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onActive(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-100"
        />
        Hiển thị trên cửa hàng ngay khi lưu
      </label>
    </>
  );
}
