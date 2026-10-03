// Owner wallet detail: the row plus its campaign for full context.
// Unknown ids and other owners' wallets read as 404; the campaign join
// is best-effort so a wallet survives its campaign's hard delete.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CUSTOMER_ID,
  VOUCHER_WALLET_ID,
} from "../helpers/voucher.fixtures";

// Helpers first, mocks second, system under test last.
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);

import { getMyWalletDetail } from "@/lib/vouchers/voucher-wallet.service";

beforeEach(() => {
  resetServiceMocks();
});

describe("getMyWalletDetail", () => {
  test("returns the wallet with its campaign", async () => {
    voucherStubs.walletById = makeWalletRow();
    voucherStubs.campaignById = makeCampaignRow({
      scope: "order",
      min_order: 100000,
    });
    const result = await getMyWalletDetail(
      VOUCHER_CUSTOMER_ID,
      VOUCHER_WALLET_ID,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.wallet.id).toBe(VOUCHER_WALLET_ID);
    expect(result.data.wallet.scope).toBe("order");
    expect(result.data.campaign?.slug).toBe("chao-mung");
  });

  test("keeps the wallet viewable after its campaign is gone", async () => {
    voucherStubs.walletById = makeWalletRow();
    voucherStubs.campaignById = null;
    const result = await getMyWalletDetail(
      VOUCHER_CUSTOMER_ID,
      VOUCHER_WALLET_ID,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.campaign).toBeNull();
  });

  test("404s missing wallets and other owners' wallets", async () => {
    voucherStubs.walletById = null;
    const missing = await getMyWalletDetail(
      VOUCHER_CUSTOMER_ID,
      VOUCHER_WALLET_ID,
    );
    expect(missing.ok).toBe(false);

    voucherStubs.walletById = makeWalletRow({ user_id: "someone-else" });
    const foreign = await getMyWalletDetail(
      VOUCHER_CUSTOMER_ID,
      VOUCHER_WALLET_ID,
    );
    expect(foreign.ok).toBe(false);
    if (foreign.ok) return;
    expect(foreign.status).toBe(404);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });
});
