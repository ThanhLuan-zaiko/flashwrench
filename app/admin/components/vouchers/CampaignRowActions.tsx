"use client";

import { FiEdit2, FiPower, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";

type CampaignRowActionsProps = {
  item: VoucherCampaign;
  busy: boolean;
  trashMode: boolean;
  onEdit: (item: VoucherCampaign) => void;
  onToggle: (item: VoucherCampaign) => void;
  onSoftDelete: (item: VoucherCampaign) => void;
  onHardDelete: (item: VoucherCampaign) => void;
  onRestore: (item: VoucherCampaign) => void;
};

// Update actions (edit, toggle, restore): navy outline.
const ROW_BUTTON =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#111111] px-3 py-2 text-xs font-semibold text-[#111111] transition-colors duration-200 hover:bg-[#FB923C]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-400 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800";

// Soft delete: red outline.
const DELETE_ROW_BUTTON =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-600 px-3 py-2 text-xs font-semibold text-red-700 transition-colors duration-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-red-400 dark:text-red-300 dark:hover:bg-red-950/40";

// Hard delete: red solid.
const DANGER_BUTTON =
  "flex min-h-[44px] items-center gap-1.5 rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 dark:focus-visible:ring-red-400 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-red-400 dark:text-[#111111] dark:hover:bg-red-300";

// Campaign row actions mirror PartRowActions: toggle/edit/soft delete live,
// restore/hard delete in trash mode.
export function CampaignRowActions({
  item,
  busy,
  trashMode,
  onEdit,
  onToggle,
  onSoftDelete,
  onHardDelete,
  onRestore,
}: CampaignRowActionsProps) {
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
        className={DELETE_ROW_BUTTON}
      >
        <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
        Xóa mềm
      </button>
    </span>
  );
}
