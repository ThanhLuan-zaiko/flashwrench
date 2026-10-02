// Staff management of auto-grant rules plus the "almost there" board:
// which customers sit one step below a count/spend milestone.
import { randomUUID } from "node:crypto";
import type { UserRole } from "@/lib/auth/user.types";
import { isUuid } from "@/lib/validation";
import {
  findAutoRuleRowById,
  insertAutoRule,
  listAutoRuleRows,
  listCustomerStatsRows,
  setAutoRuleActive,
} from "./auto-rule.repository";
import type {
  AutoRuleResult,
  AutoRuleRow,
  CreateAutoRuleInput,
  NearMilestoneEntry,
  VoucherAutoRule,
} from "./auto-rule.types";
import { validateAutoRuleInput } from "./auto-rule-validation";
import type { CampaignRow } from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import { findCampaignRowById } from "./voucher-campaign.repository";
import { dispatcherCapAllows } from "./voucher-wallet.service";

type Actor = { id: string; role: UserRole };

// Dev-scale caps for the board scan: the rollup table is read as a bounded
// token scan and only the first hits are shown.
const STATS_SCAN_LIMIT = 500;
const NEAR_LIMIT = 50;
// Spend milestones count as "near" once the remaining gap is within 20% of
// the threshold — money is continuous, one-order-away does not apply.
const NEAR_SPEND_RATIO = 0.2;

function fail<T>(status: number, form: string): AutoRuleResult<T> {
  return { ok: false, status, errors: { form } };
}

function toAutoRule(
  row: AutoRuleRow,
  campaign: CampaignRow | null,
): VoucherAutoRule {
  return {
    id: row.rule_id,
    name: row.name ?? "",
    campaignId: row.campaign_id ?? "",
    campaignCode: campaign?.code ?? "",
    campaignName: campaign?.name ?? "",
    triggerType: (row.trigger_type ??
      "signup") as VoucherAutoRule["triggerType"],
    threshold: row.threshold ?? 0,
    windowDays: row.window_days ?? 0,
    isActive: row.is_active ?? false,
    grantedCount: row.granted_count ?? 0,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
  };
}

async function campaignsById(
  rows: AutoRuleRow[],
): Promise<Map<string, CampaignRow>> {
  const ids = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const entries = await Promise.all(
    ids.map(async (id) => [id, await findCampaignRowById(id)] as const),
  );
  return new Map(
    entries.filter((entry): entry is readonly [string, CampaignRow] =>
      Boolean(entry[1]),
    ),
  );
}

export async function listAutoRules(): Promise<
  AutoRuleResult<VoucherAutoRule[]>
> {
  const rows = await listAutoRuleRows();
  const campaigns = await campaignsById(rows);
  const items = rows
    .map((row) =>
      toAutoRule(
        row,
        row.campaign_id ? (campaigns.get(row.campaign_id) ?? null) : null,
      ),
    )
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { ok: true, data: items };
}

export async function createAutoRule(
  actor: Actor,
  raw: CreateAutoRuleInput,
): Promise<AutoRuleResult<VoucherAutoRule>> {
  const fieldErrors = validateAutoRuleInput({
    name: raw.name,
    campaignId: raw.campaignId,
    triggerType: raw.triggerType,
    threshold: raw.threshold,
    windowDays: raw.windowDays,
  });
  if (fieldErrors) return { ok: false, status: 400, errors: fieldErrors };
  const campaign = await findCampaignRowById(raw.campaignId.trim());
  if (!campaign) return fail(404, "Không tìm thấy chiến dịch.");
  if (isDeletedFlag(campaign.is_deleted)) {
    return fail(400, "Chiến dịch đang nằm trong thùng rác.");
  }
  // Wiring a rule to a campaign is the same power as granting from it —
  // dispatchers stay inside their allow_dispatcher_grant + value cap.
  const blocked = dispatcherCapAllows(actor, campaign);
  if (blocked) return blocked as AutoRuleResult<VoucherAutoRule>;

  const ruleId = randomUUID();
  await insertAutoRule({
    ruleId,
    name: raw.name.trim(),
    campaignId: campaign.campaign_id,
    triggerType: raw.triggerType,
    threshold: Math.trunc(raw.threshold ?? 0),
    windowDays: Math.trunc(raw.windowDays ?? 0),
    isActive: raw.isActive ?? true,
    createdBy: actor.id,
    now: new Date(),
  });
  const row = await findAutoRuleRowById(ruleId);
  if (!row) return fail(500, "Không tạo được quy tắc.");
  return { ok: true, data: toAutoRule(row, campaign) };
}

export async function toggleAutoRule(
  actor: Actor,
  ruleId: string,
  isActive: boolean,
): Promise<AutoRuleResult<VoucherAutoRule>> {
  if (!isUuid(ruleId)) return fail(400, "Quy tắc không hợp lệ.");
  const row = await findAutoRuleRowById(ruleId);
  if (!row) return fail(404, "Không tìm thấy quy tắc.");
  const campaign = row.campaign_id
    ? await findCampaignRowById(row.campaign_id)
    : null;
  // Enabling is the dangerous direction: the campaign must still exist and
  // the actor still has to be allowed to grant from it. Disabling is free.
  if (isActive) {
    if (!campaign || isDeletedFlag(campaign.is_deleted)) {
      return fail(400, "Chiến dịch của quy tắc không còn tồn tại.");
    }
    const blocked = dispatcherCapAllows(actor, campaign);
    if (blocked) return blocked as AutoRuleResult<VoucherAutoRule>;
  }
  await setAutoRuleActive(ruleId, isActive);
  const next = await findAutoRuleRowById(ruleId);
  if (!next) return fail(500, "Không đổi được trạng thái quy tắc.");
  return { ok: true, data: toAutoRule(next, campaign) };
}

export type NearMilestonePage = {
  entries: NearMilestoneEntry[];
  scannedCustomers: number;
  truncated: boolean;
};

// Customers one step below a count/spend milestone — the dispatcher can
// still nudge or grant manually before automation lands.
export async function listNearMilestones(): Promise<
  AutoRuleResult<NearMilestonePage>
> {
  const rules = (await listAutoRuleRows()).filter(
    (row) =>
      row.is_active &&
      (row.trigger_type === "booking_count" ||
        row.trigger_type === "order_count" ||
        row.trigger_type === "spend_total") &&
      (row.threshold ?? 0) > 0,
  );
  if (rules.length === 0) {
    return {
      ok: true,
      data: { entries: [], scannedCustomers: 0, truncated: false },
    };
  }
  const stats = await listCustomerStatsRows(STATS_SCAN_LIMIT);
  const entries: NearMilestoneEntry[] = [];
  for (const row of stats) {
    for (const rule of rules) {
      const threshold = rule.threshold ?? 0;
      if (threshold <= 0) continue;
      let current = 0;
      if (rule.trigger_type === "booking_count") {
        current = row.completed_bookings ?? 0;
      } else if (rule.trigger_type === "order_count") {
        current = row.completed_orders ?? 0;
      } else {
        current = row.total_spent ?? 0;
      }
      if (current <= 0) continue;
      const remaining = threshold - (current % threshold);
      const near =
        rule.trigger_type === "spend_total"
          ? remaining <= Math.ceil(threshold * NEAR_SPEND_RATIO)
          : remaining === 1;
      if (!near) continue;
      entries.push({
        userId: row.customer_id,
        ruleId: rule.rule_id,
        ruleName: rule.name ?? "",
        triggerType: rule.trigger_type as NearMilestoneEntry["triggerType"],
        current,
        threshold,
      });
      if (entries.length >= NEAR_LIMIT) break;
    }
    if (entries.length >= NEAR_LIMIT) break;
  }
  return {
    ok: true,
    data: {
      entries,
      scannedCustomers: stats.length,
      truncated:
        entries.length >= NEAR_LIMIT || stats.length >= STATS_SCAN_LIMIT,
    },
  };
}
