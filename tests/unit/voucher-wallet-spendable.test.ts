// Wallet spendable flag: toWallet computes it from the wallet status +
// expiry and the campaign's live window (same checks as redeem, minus
// the subtotal).
import { describe, expect, test } from "bun:test";
import { toWallet } from "@/lib/vouchers/voucher.mapper";
import type { CampaignRow } from "@/lib/vouchers/voucher.types";
import { makeCampaignRow, makeWalletRow } from "../helpers/voucher.fixtures";

const NOW = new Date("2026-10-03T00:00:00.000Z");

function mapWallet(
  wallet: Parameters<typeof makeWalletRow>[0],
  campaign?: CampaignRow | null,
) {
  return toWallet(makeWalletRow(wallet), campaign, NOW);
}

describe("toWallet spendable", () => {
  test("active wallet with a live campaign is spendable", () => {
    expect(mapWallet({}, makeCampaignRow()).spendable).toBe(true);
  });

  test("an active wallet without a campaign arg is spendable", () => {
    expect(mapWallet({}).spendable).toBe(true);
  });

  test("used or expired wallets are not spendable", () => {
    expect(mapWallet({ status: "used" }).spendable).toBe(false);
    expect(
      mapWallet({ expires_at: new Date("2026-09-01T00:00:00.000Z") }).spendable,
    ).toBe(false);
  });

  test("a missing campaign makes the wallet unspendable", () => {
    expect(mapWallet({}, null).spendable).toBe(false);
  });

  test("inactive or flagless campaigns are not live", () => {
    expect(mapWallet({}, makeCampaignRow({ is_active: false })).spendable).toBe(
      false,
    );
    expect(mapWallet({}, makeCampaignRow({ is_active: null })).spendable).toBe(
      false,
    );
  });

  test("campaigns outside their window are not live", () => {
    expect(
      mapWallet(
        {},
        makeCampaignRow({ start_at: new Date("2026-10-10T00:00:00.000Z") }),
      ).spendable,
    ).toBe(false);
    expect(
      mapWallet(
        {},
        makeCampaignRow({ end_at: new Date("2026-10-01T00:00:00.000Z") }),
      ).spendable,
    ).toBe(false);
  });
});
