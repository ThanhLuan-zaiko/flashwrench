// Typed-code claims: normalization, eligibility gates, lock + slot
// ordering and the reused-wallet fast path. Every repository and the
// realtime bus are stubbed — nothing touches a real database.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRealtimeMocks,
  voucherRedeemCodeRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  makeWalletRow,
  VOUCHER_CAMPAIGN_ID,
  VOUCHER_CUSTOMER_ID,
  VOUCHER_WALLET_ID,
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
mock.module("@/lib/vouchers/voucher-realtime", () => voucherRealtimeMocks);

import {
  claimWalletByCode,
  getRedeemCodeForViewer,
} from "@/lib/vouchers/voucher-code.service";

const NOW = new Date("2026-10-03T00:00:00.000Z");

// Claimable fixture: the typed code resolves to this campaign and the
// caller already holds the wallet the mock by_id read will return.
function arrangeClaimable(overrides?: Parameters<typeof makeCampaignRow>[0]) {
  voucherStubs.redeemCodeOwner = VOUCHER_CAMPAIGN_ID;
  voucherStubs.campaignById = makeCampaignRow({
    redeem_code: "GIAM50K",
    ...overrides,
  });
  voucherStubs.walletById = makeWalletRow();
}

function claim(overrides?: Partial<Parameters<typeof claimWalletByCode>[0]>) {
  return claimWalletByCode({
    userId: VOUCHER_CUSTOMER_ID,
    code: "GIAM50K",
    kind: "order",
    subtotal: 200000,
    now: NOW,
    ...overrides,
  });
}

function expectNoWrites() {
  expect(voucherStubs.claimLocks).toHaveLength(0);
  expect(voucherCampaignRepoMocks.claimGrantSlot).not.toHaveBeenCalled();
  expect(voucherWalletRepoMocks.insertWallet).not.toHaveBeenCalled();
}

function statusOf(result: { ok: boolean; status?: number }): number {
  return result.ok ? 200 : (result.status ?? 0);
}

beforeEach(() => {
  resetServiceMocks();
});

describe("claimWalletByCode happy path", () => {
  test("grants a wallet, claims a slot and publishes the change", async () => {
    arrangeClaimable({ total_limit: 50, per_user_limit: 3 });
    voucherStubs.walletRowsByUser = [makeWalletRow({ status: "used" })];
    const result = await claim();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.reused).toBe(false);
    expect(result.data.discount).toBe(50000);

    const lock = voucherStubs.claimLocks[0];
    expect(lock.campaignId).toBe(VOUCHER_CAMPAIGN_ID);
    expect(lock.seq).toBe(2);
    expect(voucherCampaignRepoMocks.claimGrantSlot).toHaveBeenCalledWith(
      VOUCHER_CAMPAIGN_ID,
      50,
    );

    const inserted = voucherStubs.insertedWallets[0];
    expect(inserted.walletId).toBe(lock.walletId);
    expect(inserted.grantedBy).toBeNull();
    expect(inserted.grantNote).toBe("Nhập mã GIAM50K");
    expect(inserted.campaignCode).toBe("CHAO_MUNG");
    expect(
      voucherRealtimeMocks.publishWalletChange.mock.calls[0]?.[0],
    ).toMatchObject({ kind: "voucher-granted", userId: VOUCHER_CUSTOMER_ID });
  });

  test("copies end_at to the wallet expiry", async () => {
    const endAt = new Date("2026-11-01T00:00:00.000Z");
    arrangeClaimable({ end_at: endAt });
    await claim();
    expect(voucherStubs.insertedWallets[0].expiresAt).toEqual(endAt);
  });

  test("normalizes lowercase and dashed input", async () => {
    arrangeClaimable();
    const result = await claim({ code: " giam-50k " });
    expect(result.ok).toBe(true);
    expect(voucherStubs.insertedWallets[0].grantNote).toBe("Nhập mã GIAM50K");
  });
});

describe("claimWalletByCode rejections", () => {
  test("invalid format, bad subtotal and unknown codes fail early", async () => {
    expect(statusOf(await claim({ code: "AB" }))).toBe(400);
    expect(statusOf(await claim({ subtotal: -1 }))).toBe(400);
    expect(statusOf(await claim({ subtotal: 1.5 }))).toBe(400);
    arrangeClaimable();
    voucherStubs.redeemCodeOwner = null;
    const missing = await claim();
    expect(statusOf(missing)).toBe(404);
    expect(missing.ok ? "" : missing.errors.redeemCode).toContain(
      "không tồn tại",
    );
    expectNoWrites();
  });

  test("inactive, deleted or mismatched campaigns hide behind 404", async () => {
    for (const overrides of [
      { is_active: false },
      { is_deleted: true },
      { redeem_code: "KHAC999" },
    ] as const) {
      arrangeClaimable(overrides);
      const result = await claim();
      expect(statusOf(result)).toBe(404);
      expect(result.ok ? "" : result.errors.redeemCode).toContain(
        "không tồn tại",
      );
    }
    expectNoWrites();
  });

  test("campaigns outside their window return 400s", async () => {
    arrangeClaimable({ start_at: new Date("2026-10-10T00:00:00.000Z") });
    expect(statusOf(await claim())).toBe(400);
    arrangeClaimable({ end_at: new Date("2026-10-01T00:00:00.000Z") });
    const ended = await claim();
    expect(ended.ok ? "" : ended.errors.redeemCode).toContain("hết hạn");
    expectNoWrites();
  });

  test("scope mismatches explain which kind the code serves", async () => {
    arrangeClaimable({ scope: "order" });
    const wrong = await claim({ kind: "booking" });
    expect(wrong.ok ? "" : wrong.errors.redeemCode).toContain("linh kiện");
    arrangeClaimable({ scope: "booking" });
    const wrong2 = await claim({ kind: "order" });
    expect(wrong2.ok ? "" : wrong2.errors.redeemCode).toContain("sửa xe");
    expectNoWrites();
  });

  test("below the order minimum returns the formatted floor", async () => {
    arrangeClaimable({ min_order: 150000 });
    const result = await claim({ subtotal: 100000 });
    expect(statusOf(result)).toBe(400);
    expect(result.ok ? "" : result.errors.redeemCode).toContain("150.000");
    expectNoWrites();
  });
});

describe("claimWalletByCode wallet reuse and limits", () => {
  test("an active unexpired wallet is reused with zero writes", async () => {
    arrangeClaimable();
    voucherStubs.walletRowsByUser = [makeWalletRow()];
    const result = await claim();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.reused).toBe(true);
    expect(result.data.wallet.id).toBe(VOUCHER_WALLET_ID);
    expect(result.data.discount).toBe(50000);
    expectNoWrites();
  });

  test("expired or used wallets still count toward owned", async () => {
    arrangeClaimable({ per_user_limit: 2 });
    voucherStubs.walletRowsByUser = [
      makeWalletRow({ status: "used" }),
      makeWalletRow({
        wallet_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        expires_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
    ];
    const result = await claim();
    expect(statusOf(result)).toBe(400);
    expect(result.ok ? "" : result.errors.redeemCode).toContain("đủ số lượt");
    expectNoWrites();
  });

  test("a lost claim lock returns 409 without a slot or insert", async () => {
    arrangeClaimable();
    voucherStubs.claimLockGranted = false;
    const result = await claim();
    expect(statusOf(result)).toBe(409);
    expect(voucherCampaignRepoMocks.claimGrantSlot).not.toHaveBeenCalled();
    expect(voucherWalletRepoMocks.insertWallet).not.toHaveBeenCalled();
  });

  test("a sold-out campaign releases the lock", async () => {
    arrangeClaimable();
    voucherStubs.grantSlotOutcome = "limit";
    const result = await claim();
    expect(statusOf(result)).toBe(400);
    expect(result.ok ? "" : result.errors.redeemCode).toContain("hết lượt");
    expect(voucherStubs.releasedClaimLocks).toHaveLength(1);
    expect(voucherWalletRepoMocks.insertWallet).not.toHaveBeenCalled();
  });

  test("a slot error releases the lock and returns 500", async () => {
    arrangeClaimable();
    voucherStubs.grantSlotOutcome = "error";
    const result = await claim();
    expect(statusOf(result)).toBe(500);
    expect(voucherStubs.releasedClaimLocks).toHaveLength(1);
  });

  test("an insert failure releases slot and lock then rethrows", async () => {
    arrangeClaimable();
    voucherWalletRepoMocks.insertWallet.mockImplementation(async () => {
      throw new Error("db down");
    });
    await expect(claim()).rejects.toThrow("db down");
    expect(voucherCampaignRepoMocks.releaseGrantSlot).toHaveBeenCalled();
    expect(voucherStubs.releasedClaimLocks).toHaveLength(1);
  });
});

describe("getRedeemCodeForViewer", () => {
  test("404 for unknown slugs, hidden campaigns and missing codes", async () => {
    voucherStubs.campaignSlugOwner = null;
    expect(
      statusOf(await getRedeemCodeForViewer(VOUCHER_CUSTOMER_ID, "nope", NOW)),
    ).toBe(404);

    voucherStubs.campaignSlugOwner = VOUCHER_CAMPAIGN_ID;
    voucherStubs.campaignById = makeCampaignRow({
      is_active: false,
      redeem_code: "GIAM50K",
    });
    expect(
      statusOf(
        await getRedeemCodeForViewer(VOUCHER_CUSTOMER_ID, "chao-mung", NOW),
      ),
    ).toBe(404);

    voucherStubs.campaignById = makeCampaignRow();
    expect(
      statusOf(
        await getRedeemCodeForViewer(VOUCHER_CUSTOMER_ID, "chao-mung", NOW),
      ),
    ).toBe(404);
  });

  test("owned wins over claimable when an active wallet exists", async () => {
    voucherStubs.campaignSlugOwner = VOUCHER_CAMPAIGN_ID;
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "GIAM50K" });
    voucherStubs.walletRowsByUser = [makeWalletRow()];
    const result = await getRedeemCodeForViewer(
      VOUCHER_CUSTOMER_ID,
      "CHAO-MUNG",
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      status: "owned",
      walletId: VOUCHER_WALLET_ID,
    });
  });

  test("limit hides the code once per_user_limit is reached", async () => {
    voucherStubs.campaignSlugOwner = VOUCHER_CAMPAIGN_ID;
    voucherStubs.campaignById = makeCampaignRow({
      redeem_code: "GIAM50K",
      per_user_limit: 1,
    });
    voucherStubs.walletRowsByUser = [makeWalletRow({ status: "used" })];
    const result = await getRedeemCodeForViewer(
      VOUCHER_CUSTOMER_ID,
      "chao-mung",
      NOW,
    );
    expect(result.ok && result.data.status).toBe("limit");
  });

  test("claimable viewers receive the code", async () => {
    voucherStubs.campaignSlugOwner = VOUCHER_CAMPAIGN_ID;
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "GIAM50K" });
    const result = await getRedeemCodeForViewer(
      VOUCHER_CUSTOMER_ID,
      "chao-mung",
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({ status: "claimable", code: "GIAM50K" });
  });
});
