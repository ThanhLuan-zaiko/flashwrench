// Display helpers for the admin voucher board: one-line discount text,
// scope label and status pill copy for a campaign row.
import type {
  VoucherCampaign,
  VoucherDiscountType,
  VoucherScope,
} from "@/lib/vouchers/voucher.types";

export const DISCOUNT_TYPE_OPTIONS: {
  value: VoucherDiscountType;
  label: string;
}[] = [
  { value: "fixed", label: "Giảm tiền cố định" },
  { value: "percent", label: "Giảm theo phần trăm" },
  { value: "free_service", label: "Miễn phí dịch vụ" },
];

export const SCOPE_OPTIONS: { value: VoucherScope; label: string }[] = [
  { value: "all", label: "Mọi đơn hàng & lịch sửa" },
  { value: "order", label: "Chỉ đơn linh kiện" },
  { value: "booking", label: "Chỉ lịch sửa xe" },
];

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

// "-10% (tối đa 50.000đ)" / "-50.000đ" / "Miễn phí dịch vụ".
export function discountLabel(campaign: {
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
}): string {
  if (campaign.discountType === "percent") {
    const cap =
      campaign.maxDiscount > 0
        ? ` · tối đa ${formatVnd(campaign.maxDiscount)}`
        : "";
    return `-${campaign.discountValue}%${cap}`;
  }
  if (campaign.discountType === "free_service") return "Miễn phí dịch vụ";
  return `-${formatVnd(campaign.discountValue)}`;
}

export function scopeLabel(scope: VoucherScope): string {
  return SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? scope;
}

// Short spec line for one row: "CHAOMUNG · -50.000đ · đã phát 12/100".
export function campaignSpecLine(campaign: VoucherCampaign): string {
  const granted =
    campaign.totalLimit > 0
      ? `${campaign.grantedCount}/${campaign.totalLimit}`
      : `${campaign.grantedCount}`;
  return `${campaign.code} · ${discountLabel(campaign)} · đã phát ${granted}`;
}
