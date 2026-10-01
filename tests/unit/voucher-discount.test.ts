// Pure voucher math: discount clamping and usability guards.
import { describe, expect, test } from "bun:test";
import {
  clampVoucherDiscount,
  isWalletUsable,
} from "@/lib/vouchers/voucher-discount";

describe("clampVoucherDiscount", () => {
  test("percent respects the max cap and the subtotal", () => {
    expect(
      clampVoucherDiscount({
        discountType: "percent",
        discountValue: 20,
        maxDiscount: 50000,
        subtotal: 500000,
      }),
    ).toBe(50000);
    expect(
      clampVoucherDiscount({
        discountType: "percent",
        discountValue: 10,
        maxDiscount: 0,
        subtotal: 200000,
      }),
    ).toBe(20000);
  });

  test("fixed never exceeds the subtotal", () => {
    expect(
      clampVoucherDiscount({
        discountType: "fixed",
        discountValue: 100000,
        maxDiscount: 0,
        subtotal: 60000,
      }),
    ).toBe(60000);
  });

  test("free service covers the whole subtotal", () => {
    expect(
      clampVoucherDiscount({
        discountType: "free_service",
        discountValue: 1,
        maxDiscount: 0,
        subtotal: 350000,
      }),
    ).toBe(350000);
    expect(
      clampVoucherDiscount({
        discountType: "fixed",
        discountValue: 50000,
        maxDiscount: 0,
        subtotal: 0,
      }),
    ).toBe(0);
  });
});

describe("isWalletUsable", () => {
  const base = {
    status: "active",
    campaignActive: true,
    now: new Date("2026-10-01T00:00:00Z"),
    startAt: null as Date | null,
    endAt: null as Date | null,
    expiresAt: null as Date | null,
    minOrder: 100000,
    subtotal: 200000,
  };

  test("accepts a valid wallet", () => {
    expect(isWalletUsable(base)).toEqual({ ok: true });
  });

  test("rejects used, inactive and expired wallets", () => {
    expect(isWalletUsable({ ...base, status: "used" }).ok).toBe(false);
    expect(isWalletUsable({ ...base, campaignActive: false }).ok).toBe(false);
    expect(
      isWalletUsable({
        ...base,
        expiresAt: new Date("2026-09-01T00:00:00Z"),
      }).ok,
    ).toBe(false);
  });

  test("rejects orders below the minimum", () => {
    const result = isWalletUsable({ ...base, subtotal: 50000 });
    expect(result.ok).toBe(false);
  });
});
