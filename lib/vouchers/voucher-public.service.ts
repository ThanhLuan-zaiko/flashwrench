// Public campaign feed for customer advertising. Only live campaigns
// customers may see: active, not deleted, inside the time window and not
// sold out. Small config table so filtering in the service is fine.
import { toPublicCampaign } from "./voucher.mapper";
import type {
  CampaignRow,
  PublicVoucherCampaign,
  VoucherResult,
} from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  findCampaignIdBySlug,
  findCampaignRowById,
  listCampaignRows,
} from "./voucher-campaign.repository";

export function isPublicVisible(
  row: CampaignRow,
  now: Date = new Date(),
): boolean {
  if (isDeletedFlag(row.is_deleted)) return false;
  if (row.is_active !== true) return false;
  if (row.start_at && now < row.start_at) return false;
  if (row.end_at && now > row.end_at) return false;
  const total = row.total_limit ?? 0;
  const granted = row.granted_count ?? 0;
  if (total > 0 && granted >= total) return false;
  return true;
}

export async function listPublicCampaigns(
  now: Date = new Date(),
): Promise<VoucherResult<PublicVoucherCampaign[]>> {
  const rows = await listCampaignRows();
  const items = rows
    .filter((row) => isPublicVisible(row, now))
    .sort(
      (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
    )
    .map(toPublicCampaign);
  return { ok: true, data: items };
}

// Public campaign detail by slug: 404 for unknown slugs and for rows
// that are no longer advertised (deleted, paused, expired, sold out),
// so shared links never show a dead promotion as running.
export async function getPublicCampaignBySlug(
  rawSlug: string,
  now: Date = new Date(),
): Promise<VoucherResult<PublicVoucherCampaign>> {
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) {
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy ưu đãi." },
    };
  }
  const campaignId = await findCampaignIdBySlug(slug);
  if (!campaignId) {
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy ưu đãi." },
    };
  }
  const row = await findCampaignRowById(campaignId);
  if (!row || !isPublicVisible(row, now)) {
    return { ok: false, status: 404, errors: { form: "Ưu đãi đã kết thúc." } };
  }
  return { ok: true, data: toPublicCampaign(row) };
}
