// Win-back sweep for auto-grant rules, split from auto-grant.service so
// both stay under the file-size budget. Driven by
// scripts/voucher-winback-scan.ts: a customer inactive for the rule's
// window gets the voucher at most once per calendar month — the dedupe
// key carries the month bucket.
import { monthBucket } from "@/lib/auth/user.types";
import { campaignOpenForGrant, grantFromRule } from "./auto-grant.service";
import {
  listAutoRuleRows,
  listCustomerStatsRows,
} from "./auto-rule.repository";
import { findCampaignRowById } from "./voucher-campaign.repository";

export type WinBackScanResult = {
  scannedCustomers: number;
  granted: number;
};

const WIN_BACK_SCAN_LIMIT = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function runVoucherWinBackScan(
  now: Date = new Date(),
): Promise<WinBackScanResult> {
  const rules = (await listAutoRuleRows()).filter(
    (row) =>
      row.is_active === true &&
      row.trigger_type === "win_back" &&
      (row.window_days ?? 0) > 0 &&
      row.campaign_id !== null,
  );
  if (rules.length === 0) return { scannedCustomers: 0, granted: 0 };
  const stats = await listCustomerStatsRows(WIN_BACK_SCAN_LIMIT);
  let granted = 0;
  for (const row of stats) {
    const lastActivity = row.last_activity_at;
    if (!lastActivity) continue;
    for (const rule of rules) {
      const quietFor = Math.floor(
        (now.getTime() - lastActivity.getTime()) / DAY_MS,
      );
      if (quietFor < (rule.window_days ?? 0)) continue;
      try {
        const campaign = rule.campaign_id
          ? await findCampaignRowById(rule.campaign_id)
          : null;
        if (!campaignOpenForGrant(campaign, now)) continue;
        const key = `wb:${monthBucket(now)}`;
        if (await grantFromRule(rule, campaign, row.customer_id, key, now)) {
          granted += 1;
        }
      } catch {}
    }
  }
  return { scannedCustomers: stats.length, granted };
}
