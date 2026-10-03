// Best-wallet picker: scope, minimum order and max saving.
import { describe, expect, test } from "bun:test";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import {
  pickBestWallet,
  ticketDiscountText,
} from "@/lib/vouchers/voucher-pick";

function makeWallet(
  overrides: Partial<VoucherWallet> & { id: string },
): VoucherWallet {
  return {
    userId: "customer-1",
    campaignId: "campaign-1",
    campaignCode: "CODE",
    campaignName: "Chien dich",
    imageUrl: "",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    scope: "all",
    minOrder: 0,
    status: "active",
    grantedAt: null,
    expiresAt: null,
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
    ...overrides,
  };
}

describe("pickBestWallet", () => {
  test("picks the largest saving for the price", () => {
    const wallets = [
      makeWallet({ id: "w-small", discountValue: 20000 }),
      makeWallet({ id: "w-big", discountValue: 50000 }),
    ];
    const pick = pickBestWallet(wallets, "order", 200000);
    expect(pick?.wallet.id).toBe("w-big");
    expect(pick?.discount).toBe(50000);
    expect(pick?.count).toBe(2);
  });

  test("respects scope and minimum order", () => {
    const wallets = [
      makeWallet({ id: "w-booking", scope: "booking" }),
      makeWallet({ id: "w-min", scope: "order", minOrder: 999999 }),
      makeWallet({ id: "w-used", scope: "order", status: "used" }),
    ];
    expect(pickBestWallet(wallets, "order", 200000)).toBeNull();
  });

  test("caps percent by max discount and fixed by subtotal", () => {
    const wallets = [
      makeWallet({
        id: "w-percent",
        discountType: "percent",
        discountValue: 50,
        maxDiscount: 30000,
      }),
      makeWallet({ id: "w-fixed", discountValue: 20000 }),
    ];
    const pick = pickBestWallet(wallets, "booking", 200000);
    expect(pick?.wallet.id).toBe("w-percent");
    expect(pick?.discount).toBe(30000);
    expect(ticketDiscountText(pick?.wallet as VoucherWallet, 30000)).toContain(
      "30.000",
    );
  });

  test("labels free service tickets", () => {
    const wallet = makeWallet({ id: "w-free", discountType: "free_service" });
    expect(ticketDiscountText(wallet, 350000)).toBe("Miễn phí công sửa");
  });
});
