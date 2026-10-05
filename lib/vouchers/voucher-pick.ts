// Pure picker for the storefront ticket badges: which owned wallet saves
// the most on a given price. Mirrors WalletPicker filtering plus a max.
import type { VoucherScope, VoucherWallet } from "./voucher.types";
import { clampVoucherDiscount } from "./voucher-discount";

export type VoucherKind = Exclude<VoucherScope, "all">;

export type BestWalletPick = {
  wallet: VoucherWallet;
  discount: number;
  count: number;
};

function discountFor(wallet: VoucherWallet, subtotal: number): number {
  return clampVoucherDiscount({
    discountType: wallet.discountType,
    discountValue: wallet.discountValue,
    maxDiscount: wallet.maxDiscount,
    subtotal,
  });
}

export function pickBestWallet(
  wallets: readonly VoucherWallet[],
  kind: VoucherKind,
  subtotal: number,
): BestWalletPick | null {
  const usable = wallets.filter(
    (wallet) =>
      wallet.status === "active" &&
      wallet.spendable &&
      (wallet.scope === "all" || wallet.scope === kind) &&
      subtotal >= wallet.minOrder &&
      discountFor(wallet, subtotal) > 0,
  );
  if (usable.length === 0) return null;
  let best = usable[0];
  let bestDiscount = discountFor(best, subtotal);
  for (const wallet of usable.slice(1)) {
    const discount = discountFor(wallet, subtotal);
    if (discount > bestDiscount) {
      best = wallet;
      bestDiscount = discount;
    }
  }
  return { wallet: best, discount: bestDiscount, count: usable.length };
}

export function ticketDiscountText(
  wallet: VoucherWallet,
  discount: number,
): string {
  if (wallet.discountType === "free_service") return "Miễn phí công sửa";
  return `Giảm ${new Intl.NumberFormat("vi-VN").format(discount)}đ`;
}
