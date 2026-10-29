// Shared helpers for public promotion surfaces: Vietnamese copy and the
// audience/scope match used by the banner and teaser. Pure functions.
import type {
  VoucherCampaign,
  VoucherEarnHint,
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

export type PromoValueParts = {
  value: string;
  unit: string;
};

// Big-number split for the spotlight: the headline figure on its own line
// and a short caption beside it ("30%" + "Giảm", "Miễn phí" + "Công sửa").
export function promoValueParts(campaign: {
  discountType: VoucherCampaign["discountType"];
  discountValue: number;
}): PromoValueParts {
  if (campaign.discountType === "percent") {
    return { value: `${campaign.discountValue}%`, unit: "Giảm" };
  }
  if (campaign.discountType === "free_service") {
    return { value: "Miễn phí", unit: "Công sửa" };
  }
  return { value: formatPromoVnd(campaign.discountValue), unit: "Giảm ngay" };
}

// One-line value for compact thumbnails, without the percent cap.
export function promoShortLabel(campaign: {
  discountType: VoucherCampaign["discountType"];
  discountValue: number;
}): string {
  if (campaign.discountType === "free_service") return "Miễn phí công";
  const { value } = promoValueParts(campaign);
  return `Giảm ${value}`;
}

// Terms line under the figure: minimum order, percent cap, expiry.
export function promoTermsLabel(campaign: {
  discountType: VoucherCampaign["discountType"];
  maxDiscount: number;
  minOrder: number;
  endAt: string | null;
}): string {
  const parts = [promoConditionLabel(campaign)];
  if (campaign.discountType === "percent" && Number(campaign.maxDiscount) > 0) {
    parts.push(`Tối đa ${formatPromoVnd(campaign.maxDiscount)}`);
  }
  parts.push(promoExpiryLabel(campaign));
  return parts.join(" · ");
}

export function promoScopeLabel(scope: VoucherScope): string {
  if (scope === "order") return "Áp dụng cho đơn linh kiện";
  if (scope === "booking") return "Áp dụng cho lịch sửa xe";
  return "Áp dụng cho đơn hàng và lịch sửa";
}

// Audience a promo surface sells to: /services banners count booking
// campaigns, /products counts order ones. The shared "all" scope matches
// every audience.
export type PromoAudience = Exclude<VoucherScope, "all">;

export function promoAppliesTo(
  campaign: { scope: VoucherScope },
  audience: PromoAudience,
): boolean {
  return campaign.scope === "all" || campaign.scope === audience;
}

// "How to get this" line for an unowned card, derived from the campaign's
// active auto-rules. No rule means staff grant it by hand.
export function promoEarnHint(earn: readonly VoucherEarnHint[]): string {
  const hint = earn[0];
  if (!hint) return "Nhân viên tặng khi phục vụ bạn";
  switch (hint.trigger) {
    case "signup":
      return "Tự động khi bạn tạo tài khoản";
    case "booking_count":
      return `Tự động sau mỗi ${hint.threshold} lịch sửa hoàn tất`;
    case "order_count":
      return `Tự động sau mỗi ${hint.threshold} đơn giao thành công`;
    case "order_value":
      return `Tự động khi đơn linh kiện từ ${formatPromoVnd(hint.threshold)}`;
    case "spend_total":
      return `Tự động khi tổng chi tiêu đạt mốc ${formatPromoVnd(hint.threshold)}`;
    case "review_created":
      return "Tự động khi bạn gửi đánh giá";
    case "win_back":
      return `Tự động nếu bạn quay lại sau ${hint.windowDays} ngày`;
    default:
      return "Nhân viên tặng khi phục vụ bạn";
  }
}

export type PromoProgress = {
  ratio: number;
  label: string;
};

// Distance to the next milestone for count/spend rules. Event-style
// triggers (signup, review, order value, win-back) have no middle state,
// so they only ever show the hint line — no bar.
export function promoProgress(
  earn: readonly VoucherEarnHint[],
  stats: { bookings: number; orders: number; spent: number } | null,
): PromoProgress | null {
  if (!stats) return null;
  for (const hint of earn) {
    if (hint.threshold <= 0) continue;
    if (hint.trigger === "booking_count") {
      const step = stats.bookings % hint.threshold;
      return {
        ratio: step / hint.threshold,
        label: `Đã có ${step}/${hint.threshold} lịch sửa`,
      };
    }
    if (hint.trigger === "order_count") {
      const step = stats.orders % hint.threshold;
      return {
        ratio: step / hint.threshold,
        label: `Đã có ${step}/${hint.threshold} đơn`,
      };
    }
    if (hint.trigger === "spend_total") {
      const step = stats.spent % hint.threshold;
      return {
        ratio: step / hint.threshold,
        label: `Chi thêm ${formatPromoVnd(hint.threshold - step)} nữa để nhận`,
      };
    }
  }
  return null;
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
