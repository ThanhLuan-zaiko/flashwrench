// Seed milestone auto-rules so the /vouchers progress UI has real data:
// each entry creates (or reactivates) one active rule on a campaign.
// Safe to re-run — an existing rule with the same campaign+trigger is
// reused/reactivated instead of duplicated.
// Usage: bun run scripts/voucher-seed-milestone-rules.ts
import { randomUUID } from "node:crypto";
import { scylla } from "../lib/db/client";
import { campaignOpenForGrant } from "../lib/vouchers/auto-grant.service";
import {
  insertAutoRule,
  listAutoRuleRows,
  setAutoRuleActive,
} from "../lib/vouchers/auto-rule.repository";
import type { AutoTrigger } from "../lib/vouchers/auto-rule.types";
import { isDeletedFlag } from "../lib/vouchers/voucher.types";
import {
  findCampaignIdByCode,
  findCampaignRowById,
} from "../lib/vouchers/voucher-campaign.repository";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const RULES: {
  campaignCode: string;
  name: string;
  triggerType: AutoTrigger;
  threshold: number;
}[] = [
  {
    campaignCode: "THAY_NHOT_DINH_KY",
    name: "Setiap 3 lịch sửa selesai",
    triggerType: "booking_count",
    threshold: 3,
  },
  {
    campaignCode: "TRI_AN_KHACH_QUEN",
    name: "Total belanja 500rb",
    triggerType: "spend_total",
    threshold: 500000,
  },
  {
    campaignCode: "CHAM_XE_CUOI_TUAN",
    name: "Setiap 2 đơn giao thành công",
    triggerType: "order_count",
    threshold: 2,
  },
];

async function ensureRule(rule: (typeof RULES)[number]): Promise<void> {
  const campaignId = await findCampaignIdByCode(rule.campaignCode);
  const campaign = campaignId ? await findCampaignRowById(campaignId) : null;
  if (!campaign) {
    console.log(`  ! ${rule.campaignCode}: campaign not found, skipped`);
    return;
  }
  if (isDeletedFlag(campaign.is_deleted)) {
    console.log(`  ! ${rule.campaignCode}: in trash, skipped`);
    return;
  }
  if (!campaignOpenForGrant(campaign, new Date())) {
    console.log(`  ! ${rule.campaignCode}: not open for grants, skipped`);
    return;
  }

  const existing = (await listAutoRuleRows()).find(
    (row) =>
      row.campaign_id === campaign.campaign_id &&
      row.trigger_type === rule.triggerType,
  );
  if (existing) {
    if (existing.is_active !== true) {
      await setAutoRuleActive(existing.rule_id, true);
      console.log(
        `  = ${rule.campaignCode}: rule ${existing.rule_id} reactivated`,
      );
    } else {
      console.log(
        `  = ${rule.campaignCode}: rule ${existing.rule_id} already active`,
      );
    }
    return;
  }

  const ruleId = randomUUID();
  await insertAutoRule({
    ruleId,
    name: rule.name,
    campaignId: campaign.campaign_id,
    triggerType: rule.triggerType,
    threshold: rule.threshold,
    windowDays: 0,
    isActive: true,
    createdBy: campaign.created_by ?? ZERO_UUID,
    now: new Date(),
  });
  console.log(
    `  + ${rule.campaignCode}: rule ${ruleId} created (${rule.triggerType} >= ${rule.threshold})`,
  );
}

async function main(): Promise<number> {
  console.log("[voucher-milestones] seeding rules…");
  try {
    for (const rule of RULES) {
      try {
        await ensureRule(rule);
      } catch (error) {
        console.log(
          `  ! ${rule.campaignCode}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
    console.log("[voucher-milestones] done");
    return 0;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
