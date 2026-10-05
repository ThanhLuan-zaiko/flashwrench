// Formatting helpers for offer tickets: meta lines (minimum order,
// expiry, the typed code) and the discount headline. Pure.
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";

function expiryText(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `HSD ${date.toLocaleDateString("vi-VN")}`;
}

export function walletMeta(wallet: VoucherWallet): string[] {
  const meta: string[] = [];
  if (wallet.minOrder > 0) meta.push(`Đơn từ ${formatVnd(wallet.minOrder)}`);
  const expiry = expiryText(wallet.expiresAt);
  if (expiry) meta.push(expiry);
  return meta;
}

export function codeMeta(campaign: ClaimableCodeCampaign): string[] {
  const meta = [`Mã ${campaign.code}`];
  if (campaign.minOrder > 0)
    meta.push(`Đơn từ ${formatVnd(campaign.minOrder)}`);
  const expiry = expiryText(campaign.endAt);
  if (expiry) meta.push(expiry);
  return meta;
}

// Same headline wording as ticketDiscountText: an exact saving for the
// subtotal a wallet is priced at, never a "Giảm tới" ceiling.
export function codeTitle(
  discountType: VoucherWallet["discountType"],
  discount: number,
): string {
  if (discountType === "free_service") return "Miễn phí công sửa";
  return `Giảm ${formatVnd(discount)}`;
}
