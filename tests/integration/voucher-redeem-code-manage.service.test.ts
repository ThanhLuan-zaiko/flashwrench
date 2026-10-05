// Dispatcher redeem-code management: format guard, the LWT reservation
// dance (reserve -> update -> free old), remove/no-op paths and the
// rollback when the row write dies. Storage is stubbed — nothing
// touches a real database.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { REDEEM_CODE_TAKEN } from "@/lib/vouchers/voucher-campaign-code";
import {
  resetServiceMocks,
  voucherCampaignRepoMocks,
  voucherRedeemCodeRepoMocks,
  voucherStubs,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  VOUCHER_CAMPAIGN_ID,
} from "../helpers/voucher.fixtures";
import {
  redeemCodeManageRepoMocks,
  redeemManageStubs,
  resetRedeemManageMocks,
} from "../helpers/voucher-redeem-manage.mocks";

// Helpers first, mocks second, system under test last. The campaign repo
// mock spreads the shared handles and adds the new single-column update;
// the redeem-code repo mock wraps the shared claim/release so the suite
// can assert the reserve -> update -> free ordering.
mock.module("@/lib/vouchers/voucher-campaign.repository", () => ({
  ...voucherCampaignRepoMocks,
  ...redeemCodeManageRepoMocks,
}));
mock.module("@/lib/vouchers/voucher-redeem-code.repository", () => ({
  ...voucherRedeemCodeRepoMocks,
  claimRedeemCode: mock(async (code: string, campaignId: string) => {
    redeemManageStubs.ops.push("reserve");
    return voucherRedeemCodeRepoMocks.claimRedeemCode(code, campaignId);
  }),
  releaseRedeemCode: mock(async (code: string, campaignId: string) => {
    redeemManageStubs.ops.push("free");
    return voucherRedeemCodeRepoMocks.releaseRedeemCode(code, campaignId);
  }),
}));

import { setCampaignRedeemCode } from "@/lib/vouchers/voucher-redeem-code.service";

beforeEach(() => {
  resetServiceMocks();
  resetRedeemManageMocks();
});

describe("setCampaignRedeemCode guards", () => {
  test("404 when the campaign does not exist", async () => {
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "ABC123");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(
      redeemCodeManageRepoMocks.updateCampaignRedeemCode,
    ).not.toHaveBeenCalled();
  });

  test("400 when the campaign sits in the trash", async () => {
    voucherStubs.campaignById = makeCampaignRow({ is_deleted: true });
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "ABC123");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.form).toBeDefined();
    expect(
      redeemCodeManageRepoMocks.updateCampaignRedeemCode,
    ).not.toHaveBeenCalled();
  });

  test("400 when the normalized code fails the format rule", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "ab");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.redeemCode).toBe(
      "Mã nhập tay gồm 4–20 chữ cái không dấu hoặc chữ số.",
    );
    expect(redeemManageStubs.ops).toEqual([]);
  });

  test("409 when another campaign already owns the code", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    voucherStubs.redeemCodeOwner = "other-campaign";
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "TAKEN1");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.redeemCode).toBe(REDEEM_CODE_TAKEN);
    // The ownership lookup ran but no LWT claim was attempted.
    expect(
      voucherRedeemCodeRepoMocks.findCampaignIdByRedeemCode,
    ).toHaveBeenCalled();
    expect(voucherRedeemCodeRepoMocks.claimRedeemCode).not.toHaveBeenCalled();
    expect(redeemManageStubs.ops).toEqual([]);
    expect(
      redeemCodeManageRepoMocks.updateCampaignRedeemCode,
    ).not.toHaveBeenCalled();
  });
});

describe("setCampaignRedeemCode lifecycle", () => {
  test("sets a fresh code: reserve, write, nothing to free", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    const result = await setCampaignRedeemCode(
      VOUCHER_CAMPAIGN_ID,
      "khach hang",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.redeemCode).toBe("KHACHHANG");
    expect(redeemManageStubs.ops).toEqual(["reserve", "update"]);
    const [call] =
      voucherRedeemCodeRepoMocks.claimRedeemCode.mock.calls.at(-1) ?? [];
    expect(call).toBe("KHACHHANG");
    expect(redeemManageStubs.updates[0]?.redeemCode).toBe("KHACHHANG");
    expect(voucherStubs.redeemCodeOwner).toBe(VOUCHER_CAMPAIGN_ID);
  });

  test("replacing a code reserves first, then frees the old one", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE" });
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "newcode");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.redeemCode).toBe("NEWCODE");
    expect(redeemManageStubs.ops).toEqual(["reserve", "update", "free"]);
    expect(voucherStubs.releasedRedeemCodes).toContainEqual({
      code: "OLDCODE",
      campaignId: VOUCHER_CAMPAIGN_ID,
    });
  });

  test("an empty input removes the code without reserving", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "OLDCODE" });
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.redeemCode).toBe("");
    expect(redeemManageStubs.ops).toEqual(["update", "free"]);
    expect(redeemManageStubs.updates[0]?.redeemCode).toBeNull();
    expect(voucherStubs.releasedRedeemCodes).toContainEqual({
      code: "OLDCODE",
      campaignId: VOUCHER_CAMPAIGN_ID,
    });
  });

  test("repeating the stored code is a clean no-op", async () => {
    voucherStubs.campaignById = makeCampaignRow({ redeem_code: "SAME1" });
    const result = await setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "same-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.redeemCode).toBe("SAME1");
    expect(redeemManageStubs.ops).toEqual([]);
    expect(
      redeemCodeManageRepoMocks.updateCampaignRedeemCode,
    ).not.toHaveBeenCalled();
  });

  test("a failed write releases the fresh reservation", async () => {
    voucherStubs.campaignById = makeCampaignRow();
    redeemManageStubs.updateFails = true;
    await expect(
      setCampaignRedeemCode(VOUCHER_CAMPAIGN_ID, "newcode"),
    ).rejects.toThrow("write failed");
    expect(redeemManageStubs.ops).toEqual(["reserve", "update", "free"]);
    expect(voucherStubs.releasedRedeemCodes).toContainEqual({
      code: "NEWCODE",
      campaignId: VOUCHER_CAMPAIGN_ID,
    });
    expect(voucherStubs.redeemCodeOwner).toBeNull();
    expect(redeemManageStubs.updates).toHaveLength(0);
  });
});
