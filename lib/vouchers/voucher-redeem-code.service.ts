// Dispatcher-safe redeem-code editing: dispatchers and admins may set,
// change or clear ONLY the typed claim code of a campaign — every other
// campaign field stays admin-owned through updateCampaign. The LWT
// reservation dance mirrors updateCampaign: reserve the new code first,
// write the row, then release the previous claim so a freed code never
// stays locked to a campaign that no longer uses it.
import { toCampaign } from "./voucher.mapper";
import type { VoucherCampaign, VoucherResult } from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  findCampaignRowById,
  updateCampaignRedeemCode,
} from "./voucher-campaign.repository";
import {
  freeRedeemCode,
  REDEEM_CODE_TAKEN,
  reserveRedeemCode,
} from "./voucher-campaign-code";
import { isValidRedeemCode, normalizeRedeemCode } from "./voucher-validation";

const REDEEM_CODE_FORMAT =
  "Mã nhập tay gồm 4–20 chữ cái không dấu hoặc chữ số.";

export async function setCampaignRedeemCode(
  campaignId: string,
  rawCode: unknown,
): Promise<VoucherResult<VoucherCampaign>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) {
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy chiến dịch." },
    };
  }
  if (isDeletedFlag(existing.is_deleted)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Chiến dịch đang nằm trong thùng rác." },
    };
  }
  const next = normalizeRedeemCode(rawCode);
  const previous = existing.redeem_code ?? "";
  if (next !== "" && !isValidRedeemCode(next)) {
    return {
      ok: false,
      status: 400,
      errors: { redeemCode: REDEEM_CODE_FORMAT },
    };
  }
  // Same code (or both empty): a clean no-op — no LWT, no write.
  if (next === previous) return { ok: true, data: toCampaign(existing) };
  if (next !== "" && !(await reserveRedeemCode(next, campaignId))) {
    return {
      ok: false,
      status: 409,
      errors: { redeemCode: REDEEM_CODE_TAKEN },
    };
  }
  try {
    await updateCampaignRedeemCode(
      campaignId,
      next === "" ? null : next,
      new Date(),
    );
  } catch (error) {
    // The row write died — drop the fresh claim so the code is not left
    // owned by a campaign that never stored it.
    if (next !== "") await freeRedeemCode(next, campaignId);
    throw error;
  }
  if (previous !== "") await freeRedeemCode(previous, campaignId);
  const row = await findCampaignRowById(campaignId);
  if (!row) {
    return {
      ok: false,
      status: 500,
      errors: { form: "Không cập nhật được mã nhập tay." },
    };
  }
  return { ok: true, data: toCampaign(row) };
}
