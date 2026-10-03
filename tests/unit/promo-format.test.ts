// Shared copy for public promotion cards.
import { describe, expect, test } from "bun:test";
import {
  promoConditionLabel,
  promoDiscountLabel,
  promoExpiryLabel,
  promoScopeLabel,
} from "@/components/promotions/promo-format";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";

function makeCampaign(overrides?: Partial<VoucherCampaign>): VoucherCampaign {
  return {
    id: "preview",
    code: "CHAO_MUNG",
    slug: "chao-mung",
    name: "Chao mung",
    description: "",
    imageUrl: "",
    images: [],
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 100000,
    scope: "all",
    startAt: null,
    endAt: null,
    totalLimit: 0,
    grantedCount: 0,
    perUserLimit: 1,
    allowDispatcherGrant: true,
    dispatcherMaxValue: 0,
    isActive: true,
    isDeleted: false,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("promoDiscountLabel", () => {
  test("formats fixed, percent and free service", () => {
    expect(promoDiscountLabel(makeCampaign())).toContain("50.000đ");
    expect(
      promoDiscountLabel(
        makeCampaign({ discountType: "percent", discountValue: 10 }),
      ),
    ).toContain("10%");
    expect(
      promoDiscountLabel(makeCampaign({ discountType: "free_service" })),
    ).toContain("Miễn phí");
  });
});

describe("promoScopeLabel", () => {
  test("covers all scopes in Vietnamese", () => {
    expect(promoScopeLabel("all")).toContain("đơn hàng");
    expect(promoScopeLabel("order")).toContain("linh kiện");
    expect(promoScopeLabel("booking")).toContain("lịch sửa");
  });
});

describe("promoConditionLabel", () => {
  test("shows the minimum order or the no-minimum case", () => {
    expect(promoConditionLabel(makeCampaign())).toContain("100.000đ");
    expect(promoConditionLabel(makeCampaign({ minOrder: 0 }))).toContain(
      "Không yêu cầu",
    );
  });
});

describe("promoExpiryLabel", () => {
  test("shows the end date when set", () => {
    expect(promoExpiryLabel(makeCampaign())).toContain("hiệu lực");
    expect(
      promoExpiryLabel(makeCampaign({ endAt: "2026-12-31T00:00:00.000Z" })),
    ).toContain("Hạn đến");
  });
});
