// Voucher campaign validation: codes, slugs, money, dates, dispatcher caps.
import { describe, expect, test } from "bun:test";
import {
  normalizeVoucherCode,
  normalizeVoucherSlug,
  validateCampaignInput,
  voucherCodeFromSlug,
} from "@/lib/vouchers/voucher-validation";

describe("normalizeVoucherCode", () => {
  test("uppercases and underscores spaces", () => {
    expect(normalizeVoucherCode(" chao mung 1 ")).toBe("CHAO_MUNG_1");
  });
});

describe("normalizeVoucherSlug", () => {
  test("lowercases and trims", () => {
    expect(normalizeVoucherSlug(" Chao-Mung ")).toBe("chao-mung");
  });
});

describe("voucherCodeFromSlug", () => {
  test("uppercases and replaces dashes with underscores", () => {
    expect(voucherCodeFromSlug("chao-mung-2026")).toBe("CHAO_MUNG_2026");
  });
});

describe("validateCampaignInput", () => {
  const base = {
    code: "CHAO_MUNG",
    slug: "chao-mung",
    name: "Chao mung tai khoan moi",
    description: "",
    images: [] as string[],
    discountType: "fixed" as const,
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    scope: "all" as const,
    startAt: undefined as unknown,
    endAt: undefined as unknown,
    totalLimit: 100,
    perUserLimit: 1,
    allowDispatcherGrant: true,
    dispatcherMaxValue: 50000,
    isActive: true as const,
  };

  test("accepts a valid campaign", () => {
    expect(validateCampaignInput(base)).toBeNull();
  });

  test("rejects bad codes and percent over 100", () => {
    const badCode = validateCampaignInput({ ...base, code: "ab" });
    expect(badCode?.code).toBeDefined();
    const badPercent = validateCampaignInput({
      ...base,
      discountType: "percent",
      discountValue: 150,
    });
    expect(badPercent?.discountValue).toBeDefined();
  });

  test("rejects bad slugs", () => {
    const tooShort = validateCampaignInput({ ...base, slug: "ab" });
    expect(tooShort?.slug).toBeDefined();
    const badChars = validateCampaignInput({ ...base, slug: "Chao_Mung" });
    expect(badChars?.slug).toBeDefined();
    const doubleDash = validateCampaignInput({ ...base, slug: "chao--mung" });
    expect(doubleDash?.slug).toBeDefined();
    const tooLong = validateCampaignInput({
      ...base,
      slug: "a".repeat(33),
    });
    expect(tooLong?.slug).toBeDefined();
  });

  test("rejects end before start and bad image urls", () => {
    const badDates = validateCampaignInput({
      ...base,
      startAt: "2026-10-10",
      endAt: "2026-10-01",
    });
    expect(badDates?.endAt).toBeDefined();
    const badImage = validateCampaignInput({
      ...base,
      images: ["https://example.com/a.jpg"],
    });
    expect(badImage?.images).toBeDefined();
  });

  test("caps the gallery at 5 media urls", () => {
    const over = validateCampaignInput({
      ...base,
      images: Array.from(
        { length: 6 },
        (_, i) => `/api/media/promotion/c/${i}.webp`,
      ),
    });
    expect(over?.images).toBeDefined();
  });
});
