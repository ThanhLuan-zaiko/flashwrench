// Offer ranking: usable wallets, near-misses, claimable codes, plus the
// auto-pick and primary-offer rules the WalletPicker relies on. Pure.
import { describe, expect, test } from "bun:test";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";
import {
  nearMissWallets,
  nextAutoSelection,
  pickPrimaryOffer,
  rankClaimableCodes,
  rankUsableWallets,
} from "@/lib/vouchers/voucher-offers";

const NOW = Date.parse("2026-10-03T00:00:00.000Z");

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
    code: "GIAM50K",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    endAt: null,
    ...overrides,
  };
}

describe("rankUsableWallets", () => {
  test("keeps only eligible wallets covering the subtotal", () => {
    const ranked = rankUsableWallets(
      [
        makeWallet({ id: "ok" }),
        makeWallet({ id: "used", status: "used" }),
        makeWallet({ id: "dead", spendable: false }),
        makeWallet({
          id: "expired",
          expiresAt: "2026-10-01T00:00:00.000Z",
        }),
        makeWallet({ id: "scope", scope: "booking" }),
        makeWallet({ id: "min", minOrder: 999999 }),
        makeWallet({ id: "zero", discountType: "percent", discountValue: 0 }),
      ],
      "order",
      200000,
      NOW,
    );
    expect(ranked.map((entry) => entry.wallet.id)).toEqual(["ok"]);
  });

  test("sorts by discount, then earliest expiry, then campaign name", () => {
    const ranked = rankUsableWallets(
      [
        makeWallet({ id: "a-small", discountValue: 10000 }),
        makeWallet({
          id: "b-late",
          discountValue: 50000,
          expiresAt: "2026-12-01T00:00:00.000Z",
        }),
        makeWallet({
          id: "c-soon",
          discountValue: 50000,
          expiresAt: "2026-10-10T00:00:00.000Z",
        }),
        makeWallet({ id: "d-none", discountValue: 50000 }),
      ],
      "order",
      200000,
      NOW,
    );
    expect(ranked.map((entry) => entry.wallet.id)).toEqual([
      "c-soon",
      "b-late",
      "d-none",
      "a-small",
    ]);
  });
});

describe("nearMissWallets", () => {
  test("keeps eligible wallets needing more subtotal, by shortfall", () => {
    const near = nearMissWallets(
      [
        makeWallet({ id: "usable", minOrder: 0 }),
        makeWallet({ id: "far", minOrder: 300000, discountValue: 80000 }),
        makeWallet({ id: "near", minOrder: 250000, discountValue: 60000 }),
        makeWallet({ id: "flat", minOrder: 400000, discountValue: 0 }),
      ],
      "order",
      200000,
      NOW,
    );
    expect(near.map((entry) => entry.wallet.id)).toEqual(["near", "far"]);
    expect(near[0].shortfall).toBe(50000);
    expect(near[0].discount).toBe(60000); // priced at minOrder
  });
});

describe("rankClaimableCodes", () => {
  test("applicable codes come first by discount, then near by shortfall", () => {
    const ranked = rankClaimableCodes(
      [
        makeCode({ campaignId: "near", minOrder: 500000 }),
        makeCode({ campaignId: "big", discountValue: 90000 }),
        makeCode({ campaignId: "small", discountValue: 10000 }),
        makeCode({
          campaignId: "zero",
          discountType: "percent",
          discountValue: 0,
        }),
      ],
      200000,
    );
    expect(ranked.map((entry) => entry.campaign.campaignId)).toEqual([
      "big",
      "small",
      "near",
    ]);
    expect(ranked[2].shortfall).toBe(300000);
    expect(ranked[2].discount).toBe(50000);
  });
});

describe("nextAutoSelection", () => {
  const ids = ["w1", "w2"];

  test("opts out and manual picks are left alone", () => {
    expect(
      nextAutoSelection({
        value: null,
        autoAppliedId: null,
        optedOut: true,
        usableIds: ids,
      }),
    ).toBeUndefined();
    expect(
      nextAutoSelection({
        value: "manual",
        autoAppliedId: null,
        optedOut: false,
        usableIds: ids,
      }),
    ).toBeUndefined();
  });

  test("empty selection picks the best; no usable stays untouched", () => {
    expect(
      nextAutoSelection({
        value: null,
        autoAppliedId: null,
        optedOut: false,
        usableIds: ids,
      }),
    ).toBe("w1");
    expect(
      nextAutoSelection({
        value: null,
        autoAppliedId: null,
        optedOut: false,
        usableIds: [],
      }),
    ).toBeUndefined();
  });

  test("a stale auto pick re-picks the best or clears", () => {
    expect(
      nextAutoSelection({
        value: "w2",
        autoAppliedId: "w2",
        optedOut: false,
        usableIds: ids,
      }),
    ).toBe("w1");
    expect(
      nextAutoSelection({
        value: "w1",
        autoAppliedId: "w1",
        optedOut: false,
        usableIds: [],
      }),
    ).toBeNull();
    expect(
      nextAutoSelection({
        value: "w1",
        autoAppliedId: "w1",
        optedOut: false,
        usableIds: ids,
      }),
    ).toBeUndefined();
  });
});

describe("pickPrimaryOffer", () => {
  const usableEntry = {
    wallet: makeWallet({ id: "w1" }),
    discount: 50000,
  };
  const otherUsable = {
    wallet: makeWallet({ id: "w2", discountValue: 10000 }),
    discount: 10000,
  };
  const nearEntry = {
    wallet: makeWallet({ id: "w-near", minOrder: 250000 }),
    shortfall: 50000,
    discount: 60000,
  };
  const code = {
    campaign: makeCode({ campaignId: "c1" }),
    discount: 50000,
    shortfall: 0,
  };
  const nearCode = {
    campaign: makeCode({ campaignId: "c2", minOrder: 250000 }),
    discount: 50000,
    shortfall: 50000,
  };

  test("priority: selected > best usable > best code > nearest miss", () => {
    expect(
      pickPrimaryOffer({
        usable: [usableEntry, otherUsable],
        near: [],
        codes: [],
        value: "w2",
      }),
    ).toEqual({ type: "wallet", entry: otherUsable, selected: true });
    expect(
      pickPrimaryOffer({
        usable: [usableEntry],
        near: [],
        codes: [code],
        value: null,
      }),
    ).toEqual({ type: "wallet", entry: usableEntry, selected: false });
    expect(
      pickPrimaryOffer({
        usable: [],
        near: [nearEntry],
        codes: [code],
        value: null,
      }),
    ).toEqual({ type: "code", entry: code });
    expect(
      pickPrimaryOffer({
        usable: [],
        near: [nearEntry],
        codes: [nearCode],
        value: null,
      }),
    ).toEqual({ type: "near-wallet", entry: nearEntry });
    expect(
      pickPrimaryOffer({
        usable: [],
        near: [],
        codes: [nearCode],
        value: null,
      }),
    ).toEqual({ type: "near-code", entry: nearCode });
    expect(
      pickPrimaryOffer({ usable: [], near: [], codes: [], value: null }),
    ).toBeNull();
  });

  test("a nearer code beats a farther wallet miss", () => {
    expect(
      pickPrimaryOffer({
        usable: [],
        near: [nearEntry],
        codes: [{ ...nearCode, shortfall: 10000 }],
        value: null,
      }),
    ).toMatchObject({ type: "near-code" });
  });
});
