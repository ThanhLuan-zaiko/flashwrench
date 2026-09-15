"use client";

import { FiEdit2, FiPower, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

type ServicePriceActionsProps = {
  item: ServiceItem;
  busy: boolean;
  trashMode: boolean;
  onEdit: (item: ServiceItem) => void;
  onToggle: (item: ServiceItem) => void;
  onSoftDelete: (item: ServiceItem) => void;
  onHardDelete: (item: ServiceItem) => void;
  onRestore: (item: ServiceItem) => void;
};

const ROW_BUTTON =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

const DANGER_BUTTON =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

// Row action buttons for one price item: toggle/edit/soft delete live,
// restore/hard delete in trash mode. Extracted to keep the list small.
export function ServicePriceActions({
  item,
  busy,
  trashMode,
  onEdit,
  onToggle,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: ServicePriceActionsProps) {
  if (trashMode) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => onRestore(item)}
          aria-label={`Khôi phục ${item.name}`}
          className={ROW_BUTTON}
        >
          <FiRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Khôi phục
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onHardDelete(item)}
          aria-label={`Xóa vĩnh viễn ${item.name}`}
          className={DANGER_BUTTON}
        >
          <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Xóa cứng
        </button>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggle(item)}
        aria-label={
          item.isActive ? `Tạm tắt ${item.name}` : `Bật lại ${item.name}`
        }
        className={ROW_BUTTON}
      >
        <FiPower aria-hidden="true" className="h-3.5 w-3.5" />
        {item.isActive ? "Tạm tắt" : "Bật lại"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onEdit(item)}
        aria-label={`Sửa ${item.name}`}
        className={ROW_BUTTON}
      >
        <FiEdit2 aria-hidden="true" className="h-3.5 w-3.5" />
        Sửa
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSoftDelete(item)}
        aria-label={`Xóa mềm ${item.name}`}
        className={ROW_BUTTON}
      >
        <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
        Xóa mềm
      </button>
    </span>
  );
}
