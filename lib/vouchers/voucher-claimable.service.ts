// Claimable typed codes for pickers: public campaigns carrying a redeem
// code that this customer could still claim for the given order kind.
// Same eligibility rule as the campaign page's "claimable" status — an
// active unexpired wallet means owned, and owned past per_user_limit
// means done.

import { toDiscountType } from "./voucher.mapper";
import type { CampaignRow, VoucherResult } from "./voucher.types";
import { listCampaignRows } from "./voucher-campaign.repository";
import type { ClaimableCodeCampaign } from "./voucher-code.types";
import type { VoucherKind } from "./voucher-pick";
import { isPublicVisible } from "./voucher-visibility";
import {
  listUserWalletRefs,
  listWalletRowsByIds,
} from "./voucher-wallet.repository";

function isCandidate(
  row: CampaignRow,
  kind: VoucherKind | null,
  now: Date,
): boolean {
  if (!isPublicVisible(row, now)) return false;
  if (!row.redeem_code) return false;
  const scope = row.scope ?? "all";
  return kind === null || scope === "all" || scope === kind;
}

export async function listClaimableCodeCampaigns(
  userId: string,
  kind: VoucherKind | null,
  now = new Date(),
): Promise<VoucherResult<ClaimableCodeCampaign[]>> {
  // Small config table — the same full scan voucher-public.service does.
  const candidates = (await listCampaignRows()).filter((row) =>
    isCandidate(row, kind, now),
  );
  if (candidates.length === 0) return { ok: true, data: [] };

  // One index read; by_id rows are fetched only for wallets that belong
  // to candidate campaigns.
  const refs = await listUserWalletRefs(userId);
  const candidateIds = new Set(candidates.map((row) => row.campaign_id));
  const idsByCampaign = new Map<string, string[]>();
  for (const ref of refs) {
    if (ref.campaignId === null || !candidateIds.has(ref.campaignId)) {
      continue;
    }
    const list = idsByCampaign.get(ref.campaignId) ?? [];
    list.push(ref.walletId);
    idsByCampaign.set(ref.campaignId, list);
  }
  const rows = await listWalletRowsByIds([...idsByCampaign.values()].flat());
  const activeByCampaign = new Set(
    rows
      .filter(
        (row) =>
          row.status === "active" && (!row.expires_at || row.expires_at > now),
      )
      .map((row) => row.campaign_id),
  );

  const items = candidates
    .filter((row) => {
      if (activeByCampaign.has(row.campaign_id)) return false;
      const owned = idsByCampaign.get(row.campaign_id)?.length ?? 0;
      return owned < (row.per_user_limit ?? 1);
    })
    .sort(
      (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
    )
    .slice(0, 10)
    .map((row) => ({
      campaignId: row.campaign_id,
      slug: row.slug ?? "",
      name: row.name ?? "",
      code: row.redeem_code ?? "",
      discountType: toDiscountType(row.discount_type),
      discountValue: row.discount_value ?? 0,
      maxDiscount: row.max_discount ?? 0,
      minOrder: row.min_order ?? 0,
      endAt: row.end_at ? row.end_at.toISOString() : null,
    }));
  return { ok: true, data: items };
}
