// Shared copy for public promotion cards.
import { describe, expect, test } from "bun:test";
import {
  promoAppliesTo,
  promoConditionLabel,
  promoDiscountLabel,
  promoEarnHint,
  promoExpiryLabel,
  promoProgress,
  promoScopeLabel,
} from "@/components/promotions/promo-format";
import type { AutoTrigger } from "@/lib/vouchers/auto-rule.types";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";

function makeCampaign(overrides?: Partial<VoucherCampaign>): VoucherCampaign {
  return {
    id: "preview",
    code: "CHAO_MUNG",
    redeemCode: "",
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

describe("promoAppliesTo", () => {
  test("matches the dedicated scope plus the shared all bucket", () => {
    expect(promoAppliesTo(makeCampaign({ scope: "booking" }), "booking")).toBe(
      true,
    );
    expect(promoAppliesTo(makeCampaign({ scope: "all" }), "booking")).toBe(
      true,
    );
    expect(promoAppliesTo(makeCampaign({ scope: "order" }), "booking")).toBe(
      false,
    );
    expect(promoAppliesTo(makeCampaign({ scope: "all" }), "order")).toBe(true);
    expect(promoAppliesTo(makeCampaign({ scope: "booking" }), "order")).toBe(
      false,
    );
  });
});

describe("promoEarnHint", () => {
  test("falls back to staff-grant copy when no rule exists", () => {
    expect(promoEarnHint([])).toContain("Nhân viên");
  });

  test("renders each trigger as plain Vietnamese guidance", () => {
    const hint = (trigger: AutoTrigger, threshold = 0, windowDays = 0) => [
      { trigger, threshold, windowDays },
    ];
    expect(promoEarnHint(hint("signup"))).toContain("tạo tài khoản");
    expect(promoEarnHint(hint("booking_count", 3))).toContain("3 lịch sửa");
    expect(promoEarnHint(hint("order_count", 2))).toContain("2 đơn");
    expect(promoEarnHint(hint("order_value", 500000))).toContain("500.000đ");
    expect(promoEarnHint(hint("spend_total", 2000000))).toContain("2.000.000đ");
    expect(promoEarnHint(hint("review_created"))).toContain("đánh giá");
    expect(promoEarnHint(hint("win_back", 0, 30))).toContain("30 ngày");
  });
});

describe("promoProgress", () => {
  const stats = { bookings: 7, orders: 4, spent: 2500000 };

  test("is null without stats or without a milestone trigger", () => {
    expect(promoProgress([], stats)).toBeNull();
    expect(
      promoProgress(
        [{ trigger: "signup", threshold: 0, windowDays: 0 }],
        stats,
      ),
    ).toBeNull();
    expect(
      promoProgress(
        [{ trigger: "booking_count", threshold: 3, windowDays: 0 }],
        null,
      ),
    ).toBeNull();
  });

  test("measures the remainder toward the next count milestone", () => {
    const progress = promoProgress(
      [{ trigger: "booking_count", threshold: 3, windowDays: 0 }],
      stats,
    );
    expect(progress?.ratio).toBeCloseTo(1 / 3);
    expect(progress?.label).toContain("1/3");
  });

  test("measures spend left before the next money milestone", () => {
    const progress = promoProgress(
      [{ trigger: "spend_total", threshold: 2000000, windowDays: 0 }],
      stats,
    );
    expect(progress?.ratio).toBeCloseTo(0.25);
    expect(progress?.label).toContain("1.500.000đ");
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
