// Claimable redeem codes for pickers: which coded campaigns a customer
// may still claim for a given order kind. Storage is stubbed.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRedeemCodeRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CUSTOMER_ID,
} from "../helpers/voucher.fixtures";

mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-redeem-code.repository",
  () => voucherRedeemCodeRepoMocks,
);

import { listClaimableCodeCampaigns } from "@/lib/vouchers/voucher-claimable.service";

const NOW = new Date("2026-10-03T00:00:00.000Z");

function candidate(overrides?: Parameters<typeof makeCampaignRow>[0]) {
  return makeCampaignRow({ redeem_code: "GIAM50K", ...overrides });
}

beforeEach(() => {
  resetServiceMocks();
});

describe("listClaimableCodeCampaigns", () => {
  test("lists coded live campaigns matching the kind", async () => {
    voucherStubs.campaignRows = [
      candidate({ campaign_id: "c-order", scope: "order" }),
      candidate({ campaign_id: "c-all", scope: "all" }),
      candidate({
        campaign_id: "c-booking",
        scope: "booking",
        redeem_code: "BOOKING1",
      }),
    ];
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "order",
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.campaignId)).toEqual([
      "c-order",
      "c-all",
    ]);
    expect(result.data[0].code).toBe("GIAM50K");
  });

  test("a null kind keeps every scope", async () => {
    voucherStubs.campaignRows = [
      candidate({ campaign_id: "c-order", scope: "order" }),
      candidate({ campaign_id: "c-booking", scope: "booking" }),
      candidate({ campaign_id: "c-all", scope: "all" }),
    ];
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      null,
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.campaignId)).toEqual([
      "c-order",
      "c-booking",
      "c-all",
    ]);
  });

  test("includes scope-all campaigns for booking kind too", async () => {
    voucherStubs.campaignRows = [candidate({ scope: "all" })];
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "booking",
      NOW,
    );
    expect(result.ok && result.data).toHaveLength(1);
  });

  test("excludes hidden, code-less and sold-out campaigns", async () => {
    voucherStubs.campaignRows = [
      candidate({ is_active: false }),
      candidate({ is_deleted: true }),
      candidate({ start_at: new Date("2026-10-10T00:00:00.000Z") }),
      candidate({ end_at: new Date("2026-10-01T00:00:00.000Z") }),
      candidate({ total_limit: 2, granted_count: 2 }),
      makeCampaignRow(),
    ];
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "order",
      NOW,
    );
    expect(result.ok && result.data).toHaveLength(0);
  });

  test("excludes campaigns the customer already holds or maxed out", async () => {
    voucherStubs.campaignRows = [
      candidate({ campaign_id: "c-held" }),
      candidate({ campaign_id: "c-maxed", per_user_limit: 1 }),
      candidate({ campaign_id: "c-free", per_user_limit: 3 }),
    ];
    voucherStubs.walletRowsByUser = [
      makeWalletRow({ campaign_id: "c-held" }), // active
      makeWalletRow({
        wallet_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        campaign_id: "c-maxed",
        status: "used",
      }),
      makeWalletRow({
        wallet_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        campaign_id: "c-free",
        status: "used",
      }),
    ];
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "order",
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((item) => item.campaignId)).toEqual(["c-free"]);
  });

  test("reads the wallet index at most once and skips it with no candidates", async () => {
    voucherStubs.campaignRows = [makeCampaignRow()]; // no redeem code
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "order",
      NOW,
    );
    expect(result.ok && result.data).toHaveLength(0);
    expect(voucherWalletRepoMocks.listUserWalletRefs.mock.calls).toHaveLength(
      0,
    );
    expect(voucherWalletRepoMocks.listWalletRowsByIds.mock.calls).toHaveLength(
      0,
    );
  });

  test("reads the wallet index exactly once when candidates exist", async () => {
    voucherStubs.campaignRows = [candidate(), candidate({ campaign_id: "c2" })];
    await listClaimableCodeCampaigns(VOUCHER_CUSTOMER_ID, "order", NOW);
    expect(voucherWalletRepoMocks.listUserWalletRefs.mock.calls).toHaveLength(
      1,
    );
  });

  test("caps the result at ten campaigns", async () => {
    voucherStubs.campaignRows = Array.from({ length: 14 }, (_, i) =>
      candidate({ campaign_id: `c-${i}` }),
    );
    const result = await listClaimableCodeCampaigns(
      VOUCHER_CUSTOMER_ID,
      "order",
      NOW,
    );
    expect(result.ok && result.data).toHaveLength(10);
  });
});
