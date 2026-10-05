"use client";

import { FiX } from "react-icons/fi";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";

const APPLY_CLASS =
  "flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold whitespace-nowrap text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900";

// The select/remove button on a wallet ticket: "Áp dụng" picks it, "Bỏ"
// removes the current pick (and opts the panel out of auto-apply).
export function WalletOfferAction({
  wallet,
  selected,
  disabled = false,
  onSelect,
  onRemove,
}: {
  wallet: VoucherWallet;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onRemove: () => void;
}) {
  if (selected) {
    return (
      <button
        type="button"
        aria-label={`Bỏ voucher ${wallet.campaignName}`}
        disabled={disabled}
        onClick={onRemove}
        className={APPLY_CLASS}
      >
        <FiX aria-hidden="true" className="mr-1 h-4 w-4" />
        Bỏ
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Áp dụng voucher ${wallet.campaignName}`}
      disabled={disabled}
      onClick={() => onSelect(wallet.id)}
      className={APPLY_CLASS}
    >
      Áp dụng
    </button>
  );
}
