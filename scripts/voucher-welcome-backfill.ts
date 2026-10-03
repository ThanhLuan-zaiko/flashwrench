// One-off backfill for a welcome voucher: makes sure an active "signup"
// auto-rule exists for the campaign, then pays that rule's signup
// milestone to every existing active customer who does not own it yet.
// Safe to re-run — the rule dedupe ledger and per_user_limit both cap a
// customer at one wallet, and the campaign total_limit CAS caps the run.
// Usage: bun run scripts/voucher-welcome-backfill.ts [campaign-code] [--dry]
import { randomUUID } from "node:crypto";
import { listUserRoleRows } from "../lib/auth/user.repository";
import { scylla } from "../lib/db/client";
import {
  campaignOpenForGrant,
  grantFromRule,
} from "../lib/vouchers/auto-grant.service";
import {
  findAutoRuleRowById,
  insertAutoRule,
  listAutoRuleRows,
  setAutoRuleActive,
} from "../lib/vouchers/auto-rule.repository";
import type { AutoRuleRow } from "../lib/vouchers/auto-rule.types";
import { isDeletedFlag } from "../lib/vouchers/voucher.types";
import {
  findCampaignIdByCode,
  findCampaignRowById,
} from "../lib/vouchers/voucher-campaign.repository";
import { countUserWalletsForCampaign } from "../lib/vouchers/voucher-wallet.repository";

const DEFAULT_CODE = "CHAO_MUNG_BAN_MOI";
const RULE_NAME = "Chào mừng tài khoản mới";
// Script-created rows still need a uuid in created_by — the zero uuid
// marks "system" when the campaign itself carries no creator.
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

async function ensureSignupRule(
  campaignId: string,
  createdBy: string,
): Promise<AutoRuleRow | null> {
  const existing = (await listAutoRuleRows()).find(
    (row) => row.campaign_id === campaignId && row.trigger_type === "signup",
  );
  if (existing) {
    if (existing.is_active !== true) {
      await setAutoRuleActive(existing.rule_id, true);
      console.log(`  = rule ${existing.rule_id}: reactivated`);
      return findAutoRuleRowById(existing.rule_id);
    }
    console.log(`  = rule ${existing.rule_id}: already active, reused`);
    return existing;
  }
  const ruleId = randomUUID();
  await insertAutoRule({
    ruleId,
    name: RULE_NAME,
    campaignId,
    triggerType: "signup",
    threshold: 0,
    windowDays: 0,
    isActive: true,
    createdBy,
    now: new Date(),
  });
  console.log(`  + rule ${ruleId}: created (signup -> ${campaignId})`);
  return findAutoRuleRowById(ruleId);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const code = (
    args.find((arg) => !arg.startsWith("--")) ?? DEFAULT_CODE
  ).toUpperCase();
  console.log(
    `[voucher-welcome] campaign=${code} mode=${dry ? "dry-run" : "grant"}`,
  );
  try {
    const campaignId = await findCampaignIdByCode(code);
    const campaign = campaignId ? await findCampaignRowById(campaignId) : null;
    if (!campaign) {
      console.error(`[voucher-welcome] No campaign found for code ${code}.`);
      return 1;
    }
    if (isDeletedFlag(campaign.is_deleted)) {
      console.error("[voucher-welcome] Campaign is in the trash.");
      return 1;
    }
    if (!campaignOpenForGrant(campaign, new Date())) {
      console.error(
        "[voucher-welcome] Campaign is not open for grants (inactive or outside its window).",
      );
      return 1;
    }
    console.log(
      `  campaign "${campaign.name}" id=${campaign.campaign_id} granted=${campaign.granted_count ?? 0}/${campaign.total_limit ?? 0} per_user=${campaign.per_user_limit ?? 1}`,
    );

    const rule = await ensureSignupRule(
      campaign.campaign_id,
      campaign.created_by ?? ZERO_UUID,
    );
    if (!rule) {
      console.error("[voucher-welcome] Could not resolve the signup rule.");
      return 1;
    }

    const customers = (await listUserRoleRows()).filter(
      (row) => row.role === "customer" && row.status === "active",
    );
    console.log(`  active customers: ${customers.length}`);

    const now = new Date();
    let granted = 0;
    let skipped = 0;
    let eligible = 0;
    let errors = 0;
    for (const customer of customers) {
      try {
        if (dry) {
          const owned = await countUserWalletsForCampaign(
            customer.user_id,
            campaign.campaign_id,
          );
          if (owned < (campaign.per_user_limit ?? 1)) eligible += 1;
          continue;
        }
        if (
          await grantFromRule(rule, campaign, customer.user_id, "signup", now)
        ) {
          granted += 1;
        } else {
          skipped += 1;
        }
      } catch {
        errors += 1;
      }
    }
    console.log(
      dry
        ? `[voucher-welcome] DRY — eligible=${eligible} alreadyOwned=${customers.length - eligible}`
        : `[voucher-welcome] done — granted=${granted} skipped=${skipped} errors=${errors}`,
    );
    return errors > 0 ? 1 : 0;
  } catch (error) {
    console.error(
      `[voucher-welcome] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
