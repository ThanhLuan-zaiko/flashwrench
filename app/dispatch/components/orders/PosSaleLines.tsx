"use client";

import { FiPlus, FiTrash2 } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import type { PartItem } from "@/lib/parts/parts.types";

export type SaleLine = { key: number; partId: string; quantity: number };

type PosSaleLinesProps = {
  parts: PartItem[];
  lines: SaleLine[];
  partId: string;
  quantity: number;
  disabled: boolean;
  error?: string;
  onPartChange: (partId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAdd: () => void;
  onRemove: (key: number) => void;
};

// Line editor for the counter-sale dialog: a searchable part picker, a
// quantity box and the running line list with per-line totals.
export function PosSaleLines({
  parts,
  lines,
  partId,
  quantity,
  disabled,
  error,
  onPartChange,
  onQuantityChange,
  onAdd,
  onRemove,
}: PosSaleLinesProps) {
  const partById = new Map(parts.map((part) => [part.id, part]));
  const options = parts
    .filter((part) => part.stockQty > 0)
    .map((part) => ({
      value: part.id,
      label: `${part.name} — ${formatVnd(part.price)} · còn ${part.stockQty}`,
    }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <SelectDropdown
            label="Sản phẩm"
            value={partId}
            options={options}
            onChange={onPartChange}
            placeholder="Chọn sản phẩm"
            searchPlaceholder="Tìm linh kiện…"
            emptyTitle="Không còn sản phẩm nào"
          />
        </div>
        <input
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(event) =>
            onQuantityChange(Math.max(1, Number(event.target.value) || 1))
          }
          aria-label="Số lượng"
          className="h-11 w-20 shrink-0 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!partId || disabled}
          aria-label="Thêm vào đơn"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiPlus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {lines.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {lines.map((line) => {
            const part = partById.get(line.partId);
            return (
              <li
                key={line.key}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <span className="min-w-0 truncate text-xs text-zinc-700 dark:text-zinc-300">
                  {part?.name ?? "Sản phẩm"} × {line.quantity}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatVnd((part?.price ?? 0) * line.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(line.key)}
                    aria-label="Xóa dòng"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <FiTrash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
