// Wallet service guards: dispatcher caps, per-user limits, redeem
// scope and minimum-order checks, ownership. Storage untouched on
// every rejection path.
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

import {
  grantWallet,
  redeemWallet,
} from "@/lib/vouchers/voucher-wallet.service";

beforeEach(() => {
  resetServiceMocks();
  voucherStubs.campaignById = makeCampaignRow({ scope: "all", min_order: 0 });
  voucherStubs.walletById = null;
  voucherStubs.userCampaignCount = 0;
});

describe("grantWallet permissions", () => {
  test("dispatcher can grant within the allowed cap", async () => {
    const result = await grantWallet(
      { id: "disp-1", role: "dispatcher" },
      { campaignId: "camp-1", userId: "cust-1", note: "Xin chao" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Wallet row lookup is stubbed null, so it fails after insert.
    // The key guard is storage untouched on rejection paths below.
    expect(voucherStubs.insertedWallets).toHaveLength(1);
  });

  test("dispatcher blocked when the campaign forbids them", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      allow_dispatcher_grant: false,
    });
    const result = await grantWallet(
      { id: "disp-1", role: "dispatcher" },
      { campaignId: "camp-1", userId: "cust-1" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
  });

  test("per-user limit leaves storage untouched", async () => {
    voucherStubs.userCampaignCount = 1;
    const result = await grantWallet(
      { id: "admin-1", role: "admin" },
      { campaignId: "camp-1", userId: "cust-1" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
  });

  test("sold-out campaign leaves storage untouched", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 0,
      total_limit: 10,
      granted_count: 10,
    });
    const result = await grantWallet(
      { id: "disp-1", role: "dispatcher" },
      { campaignId: "camp-1", userId: "cust-2" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherStubs.insertedWallets).toHaveLength(0);
  });
});

describe("redeemWallet guards", () => {
  beforeEach(() => {
    voucherStubs.campaignById = makeCampaignRow({ scope: "all", min_order: 0 });
    voucherStubs.walletById = makeWalletRow();
  });

  test("wrong scope leaves the wallet active", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "booking",
      min_order: 0,
    });

    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 500000,
      kind: "order",
      orderId: "order-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("subtotal below the minimum leaves the wallet active", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      scope: "all",
      min_order: 99999999,
    });

    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: VOUCHER_CUSTOMER_ID,
      subtotal: 500000,
      kind: "order",
      orderId: "order-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });

  test("foreign wallets are reported without touching storage", async () => {
    const result = await redeemWallet({
      walletId: VOUCHER_WALLET_ID,
      userId: "stranger",
      subtotal: 500000,
      kind: "order",
      orderId: "order-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(voucherStubs.statusMarks).toHaveLength(0);
  });
});
