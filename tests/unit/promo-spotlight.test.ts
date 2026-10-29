// Copy and index math behind the promotion spotlight carousel.
import { describe, expect, test } from "bun:test";
import {
  promoShortLabel,
  promoTermsLabel,
  promoValueParts,
} from "@/components/promotions/promo-format";
import { wrapIndex } from "@/hooks/usePromoCarousel";

describe("promoValueParts", () => {
  test("splits percent, fixed and free service into figure and caption", () => {
    expect(
      promoValueParts({ discountType: "percent", discountValue: 30 }),
    ).toEqual({ value: "30%", unit: "Giảm" });
    expect(
      promoValueParts({ discountType: "fixed", discountValue: 40000 }),
    ).toEqual({ value: "40.000đ", unit: "Giảm ngay" });
    expect(
      promoValueParts({ discountType: "free_service", discountValue: 50000 }),
    ).toEqual({ value: "Miễn phí", unit: "Công sửa" });
  });
});

describe("promoShortLabel", () => {
  test("gives a one-line value for thumbnails", () => {
    expect(
      promoShortLabel({ discountType: "percent", discountValue: 20 }),
    ).toBe("Giảm 20%");
    expect(
      promoShortLabel({ discountType: "fixed", discountValue: 20000 }),
    ).toBe("Giảm 20.000đ");
    expect(
      promoShortLabel({ discountType: "free_service", discountValue: 0 }),
    ).toBe("Miễn phí công");
  });
});

describe("promoTermsLabel", () => {
  const base = {
    discountType: "fixed" as const,
    maxDiscount: 0,
    minOrder: 250000,
    endAt: null,
  };

  test("joins minimum order and expiry", () => {
    expect(promoTermsLabel(base)).toBe("Đơn từ 250.000đ · Còn hiệu lực");
  });

  test("adds the cap only for capped percent campaigns", () => {
    expect(
      promoTermsLabel({
        ...base,
        discountType: "percent",
        maxDiscount: 100000,
      }),
    ).toBe("Đơn từ 250.000đ · Tối đa 100.000đ · Còn hiệu lực");
    expect(promoTermsLabel({ ...base, maxDiscount: 100000 })).not.toContain(
      "Tối đa",
    );
  });

  test("treats a zero cap as uncapped", () => {
    expect(
      promoTermsLabel({ ...base, discountType: "percent", minOrder: 0 }),
    ).toBe("Không yêu cầu giá trị tối thiểu · Còn hiệu lực");
  });
});

describe("wrapIndex", () => {
  test("wraps past both ends of the rotation", () => {
    expect(wrapIndex(6, 6)).toBe(0);
    expect(wrapIndex(-1, 6)).toBe(5);
    expect(wrapIndex(3, 6)).toBe(3);
  });

  test("stays at zero for an empty list", () => {
    expect(wrapIndex(4, 0)).toBe(0);
  });
});
