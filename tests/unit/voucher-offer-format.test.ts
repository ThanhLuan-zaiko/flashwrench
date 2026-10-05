// Offer-ticket formatting: meta lines and discount headlines for wallet
// and claimable-code offers. Pure.
import { describe, expect, test } from "bun:test";
import {
  codeMeta,
  codeTitle,
  walletMeta,
} from "@/components/vouchers/voucher-offer-format";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";

function makeWallet(overrides: Partial<VoucherWallet> = {}): VoucherWallet {
  return {
    id: "w1",
    userId: "customer-1",
    campaignId: "campaign-1",
    campaignCode: "CODE",
    campaignName: "Chao mung",
    imageUrl: "",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    scope: "all",
    minOrder: 0,
    status: "active",
    spendable: true,
    grantedAt: null,
    expiresAt: null,
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
    ...overrides,
  };
}

function makeCode(
  overrides?: Partial<ClaimableCodeCampaign>,
): ClaimableCodeCampaign {
  return {
    campaignId: "c1",
    slug: "giam",
    name: "Giam gia",
    code: "GIAM20",
    discountType: "fixed",
    discountValue: 20000,
    maxDiscount: 0,
    minOrder: 0,
    endAt: null,
    ...overrides,
  };
}

describe("walletMeta", () => {
  test("omits parts that do not apply", () => {
    expect(walletMeta(makeWallet())).toEqual([]);
  });

  test("joins the minimum order and the expiry date", () => {
    const meta = walletMeta(
      makeWallet({
        minOrder: 200000,
        expiresAt: "2026-10-10T00:00:00.000Z",
      }),
    );
    expect(meta[0]).toBe("Đơn từ 200.000đ");
    expect(meta[1]).toMatch(/^HSD 10\/10\/2026$|^HSD 9\/10\/2026$/);
  });
});

describe("codeMeta", () => {
  test("always leads with the typed code", () => {
    const meta = codeMeta(
      makeCode({ minOrder: 100000, endAt: "2026-10-10T00:00:00.000Z" }),
    );
    expect(meta[0]).toBe("Mã GIAM20");
    expect(meta).toHaveLength(3);
    expect(meta[1]).toBe("Đơn từ 100.000đ");
  });
});

describe("codeTitle", () => {
  test("labels free service and money discounts like wallet tickets", () => {
    expect(codeTitle("free_service", 0)).toBe("Miễn phí công sửa");
    expect(codeTitle("fixed", 50000)).toBe("Giảm 50.000đ");
    expect(codeTitle("percent", 30000)).toBe("Giảm 30.000đ");
  });
});
