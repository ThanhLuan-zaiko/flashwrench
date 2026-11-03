"use client";

import Link from "next/link";
import { FiGift, FiTag } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useMyWallets } from "@/hooks/useVouchers";
import {
  pickBestWallet,
  ticketDiscountText,
  type VoucherKind,
} from "@/lib/vouchers/voucher-pick";

type ApplicableVoucherBadgeProps = {
  kind: VoucherKind;
  subtotal: number;
  // List cards pass false: the guest login hint is shown once above the
  // list (GuestOfferNote) instead of on every card.
  guestHint?: boolean;
};

const LOADING_CLASSES =
  "min-h-11 rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900";
const LINK_CLASSES =
  "flex min-h-11 items-center gap-1.5 text-xs font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";

// One-line voucher hint for catalog cards: the best saving with the remaining
// count, as a text link. Guests get a login hint, everyone else with no usable
// wallet renders nothing to keep the card quiet.
export function ApplicableVoucherBadge({
  kind,
  subtotal,
  guestHint = true,
}: ApplicableVoucherBadgeProps) {
  const me = useMe();
  const isAccount = me.isSuccess && me.data?.role === "customer";
  const wallets = useMyWallets(isAccount, { limit: 100 });

  if (!guestHint && !isAccount && !me.isPending) return null;
  if (me.isPending || (isAccount && wallets.isPending)) {
    return (
      <p aria-busy="true" className={LOADING_CLASSES}>
        <span className="sr-only">Đang kiểm tra ưu đãi</span>
      </p>
    );
  }

  if (me.isSuccess && me.data === null) {
    return (
      <Link
        href="/login"
        aria-label="Đăng nhập để xem ưu đãi áp được cho món này"
        className={LINK_CLASSES}
      >
        <FiGift aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        Đăng nhập để xem ưu đãi
      </Link>
    );
  }

  if (!isAccount) return null;
  if (wallets.isError) return null;
  const pick = pickBestWallet(wallets.data?.items ?? [], kind, subtotal);
  if (!pick) return null;

  return (
    <Link
      href="/vouchers"
      scroll={false}
      prefetch
      aria-label={`${pick.wallet.campaignName}: ${ticketDiscountText(pick.wallet, pick.discount)} cho món này`}
      className={LINK_CLASSES}
    >
      <FiTag aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        {ticketDiscountText(pick.wallet, pick.discount)} ·{" "}
        {pick.count > 1
          ? `Còn ${pick.count - 1} phiếu khác`
          : pick.wallet.campaignName}
      </span>
    </Link>
  );
}
