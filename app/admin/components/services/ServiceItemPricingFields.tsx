"use client";

import type { PriceUnit } from "@/lib/catalog/service-catalog.types";
import { PRICE_UNIT_LABELS } from "./catalog-format";
import { SelectDropdown } from "./SelectDropdown";

type ServiceItemPricingFieldsProps = {
  basePrice: string;
  priceUnit: PriceUnit;
  durationMin: string;
  description: string;
  basePriceError?: string;
  durationError?: string;
  onBasePrice: (value: string) => void;
  onPriceUnit: (value: PriceUnit) => void;
  onDuration: (value: string) => void;
  onDescription: (value: string) => void;
};

// Pricing block of the service form: price, unit, duration, description.
// Extracted to keep ServiceItemDialog under the 250-line limit.
export function ServiceItemPricingFields({
  basePrice,
  priceUnit,
  durationMin,
  description,
  basePriceError,
  durationError,
  onBasePrice,
  onPriceUnit,
  onDuration,
  onDescription,
}: ServiceItemPricingFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Giá (VND)
          <input
            value={basePrice}
            onChange={(e) => onBasePrice(e.target.value)}
            inputMode="numeric"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          {basePriceError && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {basePriceError}
            </span>
          )}
        </label>
        <div className="flex flex-col gap-1.5">
          <SelectDropdown
            label="Đơn vị tính"
            value={priceUnit}
            options={(Object.keys(PRICE_UNIT_LABELS) as PriceUnit[]).map(
              (u) => ({ value: u, label: PRICE_UNIT_LABELS[u] }),
            )}
            onChange={(next) => onPriceUnit(next as PriceUnit)}
            listLabel="Chọn đơn vị tính"
            unitName="đơn vị tính"
          />
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Thời lượng (phút)
          <input
            value={durationMin}
            onChange={(e) => onDuration(e.target.value)}
            inputMode="numeric"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          {durationError && (
            <span className="font-medium text-red-600 dark:text-red-400">
              {durationError}
            </span>
          )}
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Mô tả
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={3}
          placeholder="Gồm công thay, vật tư cơ bản…"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
    </>
  );
}
