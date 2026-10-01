// Voucher campaign validation: codes, money, dates, dispatcher caps.
import { describe, expect, test } from "bun:test";
import {
  normalizeVoucherCode,
  validateCampaignInput,
} from "@/lib/vouchers/voucher-validation";

describe("normalizeVoucherCode", () => {
  test("uppercases and underscores spaces", () => {
    expect(normalizeVoucherCode(" chao mung 1 ")).toBe("CHAO_MUNG_1");
  });
});

describe("validateCampaignInput", () => {
  const base = {
    code: "CHAO_MUNG",
    name: "Chao mung tai khoan moi",
    description: "",
    imageUrl: "",
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

  test("rejects end before start and bad image urls", () => {
    const badDates = validateCampaignInput({
      ...base,
      startAt: "2026-10-10",
      endAt: "2026-10-01",
    });
    expect(badDates?.endAt).toBeDefined();
    const badImage = validateCampaignInput({
      ...base,
      imageUrl: "https://example.com/a.jpg",
    });
    expect(badImage?.imageUrl).toBeDefined();
  });
});
