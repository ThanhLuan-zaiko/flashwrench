// Shared Vietnamese copy for public promotion cards. Pure formatting.
import type {
  VoucherCampaign,
  VoucherScope,
} from "@/lib/vouchers/voucher.types";

export function formatPromoVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function promoDiscountLabel(campaign: {
  discountType: VoucherCampaign["discountType"];
  discountValue: number;
  maxDiscount: number;
}): string {
  if (campaign.discountType === "percent") {
    const cap =
      campaign.maxDiscount > 0
        ? ` · tối đa ${formatPromoVnd(campaign.maxDiscount)}`
        : "";
    return `Giảm ${campaign.discountValue}%${cap}`;
  }
  if (campaign.discountType === "free_service") return "Miễn phí công sửa";
  return `Giảm ${formatPromoVnd(campaign.discountValue)}`;
}

export function promoScopeLabel(scope: VoucherScope): string {
  if (scope === "order") return "Áp dụng cho đơn linh kiện";
  if (scope === "booking") return "Áp dụng cho lịch sửa xe";
  return "Áp dụng cho đơn hàng và lịch sửa";
}

export function promoConditionLabel(campaign: { minOrder: number }): string {
  if (campaign.minOrder > 0) {
    return `Đơn từ ${formatPromoVnd(campaign.minOrder)}`;
  }
  return "Không yêu cầu giá trị tối thiểu";
}

export function promoExpiryLabel(campaign: { endAt: string | null }): string {
  if (!campaign.endAt) return "Còn hiệu lực";
  const end = new Date(campaign.endAt);
  if (Number.isNaN(end.getTime())) return "Còn hiệu lực";
  return `Hạn đến ${end.toLocaleDateString("vi-VN")}`;
}
