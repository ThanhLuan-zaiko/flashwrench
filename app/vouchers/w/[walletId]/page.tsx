import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi tiết voucher | FlashWrench",
  description: "Toàn bộ thông tin về voucher gắn với tài khoản của bạn.",
};

// Metadata-only leaf: the /vouchers layout shell renders the wallet
// detail from the [walletId] segment itself.
export default function VoucherWalletDetailPage() {
  return null;
}
