// Public campaign feed for customer advertising. Only live campaigns
// customers may see: active, not deleted, inside the time window and not
// sold out. Small config table so filtering in the service is fine.

import { listAutoRuleRows } from "./auto-rule.repository";
import { AUTO_TRIGGERS, type AutoTrigger } from "./auto-rule.types";
import { toPublicCampaign } from "./voucher.mapper";
import type {
  PublicVoucherCampaign,
  VoucherEarnHint,
  VoucherResult,
} from "./voucher.types";
import {
  findCampaignIdBySlug,
  findCampaignRowById,
  listCampaignRows,
} from "./voucher-campaign.repository";
import { isPublicVisible } from "./voucher-visibility";

// The visibility rule itself is pure and lives in voucher-visibility so
// services that skip the auto-rule repository can still share it.
export { isPublicVisible } from "./voucher-visibility";

// Active auto-rules grouped by campaign, reduced to the public essence —
// trigger + threshold. A campaign with no rule earns nothing here; the
// client falls back to the staff-grant copy.
async function earnHintsByCampaign(): Promise<Map<string, VoucherEarnHint[]>> {
  const hints = new Map<string, VoucherEarnHint[]>();
  for (const rule of await listAutoRuleRows()) {
    if (rule.is_active !== true || !rule.campaign_id) continue;
    const trigger = rule.trigger_type as AutoTrigger;
    if (!AUTO_TRIGGERS.includes(trigger)) continue;
    const list = hints.get(rule.campaign_id) ?? [];
    list.push({
      trigger,
      threshold: rule.threshold ?? 0,
      windowDays: rule.window_days ?? 0,
    });
    hints.set(rule.campaign_id, list);
  }
  return hints;
}

export async function listPublicCampaigns(
  now: Date = new Date(),
): Promise<VoucherResult<PublicVoucherCampaign[]>> {
  const [rows, earnHints] = await Promise.all([
    listCampaignRows(),
    earnHintsByCampaign(),
  ]);
  const items = rows
    .filter((row) => isPublicVisible(row, now))
    .sort(
      (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
    )
    .map((row) => toPublicCampaign(row, earnHints.get(row.campaign_id) ?? []));
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
  const earnHints = await earnHintsByCampaign();
  return {
    ok: true,
    data: toPublicCampaign(row, earnHints.get(row.campaign_id) ?? []),
  };
}
