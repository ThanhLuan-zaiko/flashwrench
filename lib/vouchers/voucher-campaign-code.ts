// Redeem-code reservation helpers for the campaign lifecycle: an LWT
// row on voucher_campaigns_by_redeem_code is the global uniqueness
// claim, so two campaigns can never share one typed code.
import {
  claimRedeemCode,
  findCampaignIdByRedeemCode,
  releaseRedeemCode,
} from "./voucher-redeem-code.repository";

export const REDEEM_CODE_TAKEN =
  "Mã nhập tay đã được dùng cho chương trình khác.";

// LWT reservation; true when this campaign owns the code afterwards.
export async function reserveRedeemCode(
  code: string,
  campaignId: string,
): Promise<boolean> {
  const owner = await findCampaignIdByRedeemCode(code);
  if (owner) return owner === campaignId;
  return claimRedeemCode(code, campaignId);
}

// Best-effort release; never throws; no-op for empty code.
export async function freeRedeemCode(
  code: string | null | undefined,
  campaignId: string,
): Promise<void> {
  if (!code) return;
  await releaseRedeemCode(code, campaignId).catch(() => undefined);
}
