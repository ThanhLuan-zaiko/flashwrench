// Campaign redeem codes: the typed code is a separate LWT-reserved
// claim, reserved on create, swappable on update and freed on hard
// delete. Storage is stubbed — nothing touches a real database.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { CreateCampaignInput } from "@/lib/vouchers/voucher.types";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRedeemCodeRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  VOUCHER_CAMPAIGN_ID,
} from "../helpers/voucher.fixtures";

mock.module("@/lib/media/media.service", () => ({
  claimAssetsForOwner: mock(async () => ({ ok: true, data: null })),
  pruneOwnerAssets: mock(async () => ({ deleted: 0 })),
}));
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

import {
  createCampaign,
  hardDeleteCampaignWithConfirm,
  updateCampaign,
} from "@/lib/vouchers/voucher-campaign.service";

function baseInput(
  overrides?: Partial<CreateCampaignInput>,
): CreateCampaignInput {
  return {
    slug: "chao-mung",
    name: "Chao mung tai khoan moi",
    description: "",
    images: [],
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    scope: "all",
    totalLimit: 100,
    perUserLimit: 1,
    allowDispatcherGrant: true,
    dispatcherMaxValue: 50000,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  resetServiceMocks();
});

describe("createCampaign redeem code", () => {
  test("reserves a redeem code and stores it on the campaign", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      redeem_code: "GIAM50K",
    });
    const result = await createCampaign(
      "admin-1",
      baseInput({ redeemCode: "giam-50k" }),
    );
    expect(result.ok).toBe(true);
    expect(voucherRedeemCodeRepoMocks.claimRedeemCode).toHaveBeenCalled();
    expect(voucherStubs.redeemCodeOwner).not.toBeNull();
    expect(voucherStubs.insertedCampaigns[0].redeemCode).toBe("GIAM50K");
  });

  test("rejects a taken redeem code and releases the other claims", async () => {
    voucherStubs.redeemCodeOwner = "other-campaign";
    const result = await createCampaign(
      "admin-1",
      baseInput({ redeemCode: "GIAM50K" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.redeemCode).toBeDefined();
    expect(
      voucherCampaignRepoMocks.releaseCampaignCode.mock.calls,
    ).toHaveLength(1);
    expect(
      voucherCampaignRepoMocks.releaseCampaignSlug.mock.calls,
    ).toHaveLength(1);
    expect(voucherStubs.insertedCampaigns).toHaveLength(0);
  });

  test("rejects an invalid redeem code before any claim", async () => {
    const result = await createCampaign(
      "admin-1",
      baseInput({ redeemCode: "AB" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.redeemCode).toBeDefined();
    expect(voucherCampaignRepoMocks.claimCampaignSlug.mock.calls).toHaveLength(
      0,
    );
    expect(voucherCampaignRepoMocks.claimCampaignCode.mock.calls).toHaveLength(
      0,
    );
  });
});

describe("updateCampaign redeem code", () => {
  test("changing the code reserves the new one then frees the old", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE1" });
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ redeemCode: "newcode9" }),
    );
    expect(result.ok).toBe(true);
    const update =
      voucherCampaignRepoMocks.updateCampaignRows.mock.calls[0]?.[0];
    expect(update?.redeemCode).toBe("NEWCODE9");
    expect(
      voucherRedeemCodeRepoMocks.claimRedeemCode.mock.calls[0],
    ).toMatchObject(["NEWCODE9", VOUCHER_CAMPAIGN_ID]);
    expect(voucherStubs.releasedRedeemCodes).toEqual([
      { code: "OLDCODE1", campaignId: VOUCHER_CAMPAIGN_ID },
    ]);
  });

  test("an undefined redeemCode keeps the stored code untouched", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE1" });
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ name: "Ten moi hoan toan" }),
    );
    expect(result.ok).toBe(true);
    expect(voucherRedeemCodeRepoMocks.claimRedeemCode.mock.calls).toHaveLength(
      0,
    );
    expect(voucherStubs.releasedRedeemCodes).toHaveLength(0);
    const update =
      voucherCampaignRepoMocks.updateCampaignRows.mock.calls[0]?.[0];
    expect(update?.redeemCode).toBe("OLDCODE1");
  });

  test("an empty redeemCode clears the stored code", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE1" });
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ redeemCode: "" }),
    );
    expect(result.ok).toBe(true);
    const update =
      voucherCampaignRepoMocks.updateCampaignRows.mock.calls[0]?.[0];
    expect(update?.redeemCode).toBeNull();
    expect(voucherStubs.releasedRedeemCodes).toEqual([
      { code: "OLDCODE1", campaignId: VOUCHER_CAMPAIGN_ID },
    ]);
  });

  test("a taken redeem code blocks the update with 409", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE1" });
    voucherStubs.redeemCodeOwner = "other-campaign";
    const result = await updateCampaign(
      VOUCHER_CAMPAIGN_ID,
      baseInput({ redeemCode: "TAKEN99" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.redeemCode).toBeDefined();
    expect(voucherCampaignRepoMocks.updateCampaignRows).not.toHaveBeenCalled();
  });
});

describe("hard delete redeem code", () => {
  test("hard delete frees the redeem code", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      is_deleted: true,
      redeem_code: "GIAM50K",
    });
    const result = await hardDeleteCampaignWithConfirm(
      VOUCHER_CAMPAIGN_ID,
      "chao-mung",
    );
    expect(result.ok).toBe(true);
    expect(voucherStubs.releasedRedeemCodes).toEqual([
      { code: "GIAM50K", campaignId: VOUCHER_CAMPAIGN_ID },
    ]);
  });
});
