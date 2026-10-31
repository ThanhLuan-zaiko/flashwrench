import type { VoucherWallet } from "@/lib/vouchers/voucher.types";

// Customer-facing label for one wallet. An active wallet whose campaign is
// switched off or outside its window is not spendable, so it must not read
// as "Còn hiệu lực".
export function walletStatusLabel(
  wallet: Pick<VoucherWallet, "status" | "spendable">,
): string {
  if (wallet.status === "used") return "Đã dùng";
  if (wallet.status === "expired") return "Hết hạn";
  if (wallet.status === "revoked") return "Đã thu hồi";
  return wallet.spendable ? "Còn hiệu lực" : "Tạm ngưng";
}
