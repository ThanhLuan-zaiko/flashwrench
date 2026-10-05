// Stub seam for the dispatcher redeem-code editor service: the
// single-column update is recorded, mirrored onto `campaignById` like
// the real row write, and `updateFails` simulates a dropped write so
// tests can watch the reservation rollback. `ops` logs call order
// across the reserve -> update -> free dance (suite-wrapped mocks push
// their own labels).
import { mock } from "bun:test";
import { voucherStubs } from "./voucher.mocks";

export const redeemManageStubs = {
  updateFails: false,
  ops: [] as string[],
  updates: [] as {
    campaignId: string;
    redeemCode: string | null;
    now: Date;
  }[],
};

export const redeemCodeManageRepoMocks = {
  updateCampaignRedeemCode: mock(
    async (
      campaignId: string,
      redeemCode: string | null,
      now: Date,
    ): Promise<void> => {
      redeemManageStubs.ops.push("update");
      if (redeemManageStubs.updateFails) throw new Error("write failed");
      redeemManageStubs.updates.push({ campaignId, redeemCode, now });
      if (voucherStubs.campaignById?.campaign_id === campaignId) {
        voucherStubs.campaignById = {
          ...voucherStubs.campaignById,
          redeem_code: redeemCode,
          updated_at: now,
        };
      }
    },
  ),
};

export function resetRedeemManageMocks(): void {
  redeemManageStubs.updateFails = false;
  redeemManageStubs.ops = [];
  redeemManageStubs.updates = [];
  redeemCodeManageRepoMocks.updateCampaignRedeemCode.mockClear();
}
