// Auto-grant engine: domain events (signup, booking completion, order
// delivery/refund, review posted) evaluate the active rules and issue
// campaign vouchers under the same caps as manual grants. Every public
// handler is best-effort and never throws — a voucher hiccup must never
// fail the signup/booking/order it piggybacks on. The win-back sweep
// lives in auto-grant-winback.service.ts.
import { randomUUID } from "node:crypto";
import {
  bumpRuleGrantedCount,
  claimAutoGrantDedupe,
  listAutoRuleRows,
  releaseAutoGrantDedupe,
} from "./auto-rule.repository";
import type {
  AutoRuleRow,
  AutoTrigger,
  CustomerStatsRow,
} from "./auto-rule.types";
import { applyCustomerActivity } from "./customer-stats.service";
import type { CampaignRow } from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  claimGrantSlot,
  findCampaignRowById,
  releaseGrantSlot,
} from "./voucher-campaign.repository";
import { publishWalletChange } from "./voucher-realtime";
import {
  countUserWalletsForCampaign,
  insertWallet,
} from "./voucher-wallet.repository";

// One auto-grant: claim the milestone in the ledger first (LWT dedupe),
// then reuse the campaign caps — per_user_limit and the total_limit CAS
// slot — before writing the wallet. Any failure releases the claims so a
// retry can still pay the milestone out. Exported for the win-back sweep
// module, same domain.
export async function grantFromRule(
  rule: AutoRuleRow,
  campaign: CampaignRow,
  userId: string,
  dedupeKey: string,
  now: Date,
): Promise<boolean> {
  const walletId = randomUUID();
  const claimed = await claimAutoGrantDedupe(
    rule.rule_id,
    userId,
    dedupeKey,
    walletId,
    now,
  );
  if (!claimed) return false;
  try {
    const owned = await countUserWalletsForCampaign(
      userId,
      campaign.campaign_id,
    );
    if (owned >= (campaign.per_user_limit ?? 1)) {
      await releaseAutoGrantDedupe(rule.rule_id, userId, dedupeKey);
      return false;
    }
    const slot = await claimGrantSlot(
      campaign.campaign_id,
      campaign.total_limit ?? 0,
    );
    if (slot !== "ok") {
      await releaseAutoGrantDedupe(rule.rule_id, userId, dedupeKey);
      return false;
    }
    try {
      await insertWallet({
        walletId,
        userId,
        campaignId: campaign.campaign_id,
        campaignCode: campaign.code ?? "",
        campaignName: campaign.name ?? "",
        imageUrl: campaign.image_url ?? "",
        discountType:
          campaign.discount_type === "percent" ||
          campaign.discount_type === "free_service"
            ? campaign.discount_type
            : "fixed",
        discountValue: campaign.discount_value ?? 0,
        maxDiscount: campaign.max_discount ?? 0,
        grantedBy: null,
        grantNote: `Tự động: ${rule.name ?? ""}`,
        grantedAt: now,
        expiresAt: campaign.end_at ?? null,
      });
    } catch (error) {
      await releaseGrantSlot(campaign.campaign_id).catch(() => undefined);
      throw error;
    }
    await bumpRuleGrantedCount(rule.rule_id).catch(() => undefined);
    void publishWalletChange({
      kind: "voucher-granted",
      walletId,
      userId,
    });
    return true;
  } catch {
    await releaseAutoGrantDedupe(rule.rule_id, userId, dedupeKey).catch(
      () => undefined,
    );
    return false;
  }
}

type EvalContext = {
  userId: string;
  stats: CustomerStatsRow | null;
  orderId?: string;
  orderTotal?: number;
  reviewRefId?: string;
  spendDelta?: number;
  now: Date;
};

// Milestones a rule owes this event, expressed as dedupe keys. An empty
// list means the event does not qualify the rule at all.
function dedupeKeysFor(rule: AutoRuleRow, ctx: EvalContext): string[] {
  const threshold = rule.threshold ?? 0;
  switch (rule.trigger_type) {
    case "signup":
      return ["signup"];
    case "booking_count": {
      const count = ctx.stats?.completed_bookings ?? 0;
      return count > 0 && threshold > 0 && count % threshold === 0
        ? [`b${count / threshold}`]
        : [];
    }
    case "order_count": {
      const count = ctx.stats?.completed_orders ?? 0;
      return count > 0 && threshold > 0 && count % threshold === 0
        ? [`o${count / threshold}`]
        : [];
    }
    case "order_value":
      return ctx.orderId !== undefined &&
        (ctx.orderTotal ?? 0) >= threshold &&
        threshold > 0
        ? [`order:${ctx.orderId}`]
        : [];
    case "spend_total": {
      const spent = ctx.stats?.total_spent ?? 0;
      const before = Math.max(0, spent - (ctx.spendDelta ?? 0));
      if (threshold <= 0) return [];
      const keys: string[] = [];
      for (
        let mark = Math.floor(before / threshold) + 1;
        mark <= Math.floor(spent / threshold);
        mark += 1
      ) {
        keys.push(`s${mark}`);
      }
      return keys;
    }
    case "review_created":
      return ctx.reviewRefId ? [`review:${ctx.reviewRefId}`] : [];
    default:
      return [];
  }
}

export function campaignOpenForGrant(
  campaign: CampaignRow | null,
  now: Date,
): campaign is CampaignRow {
  if (!campaign?.is_active) return false;
  if (isDeletedFlag(campaign.is_deleted)) return false;
  if (campaign.start_at && now < campaign.start_at) return false;
  if (campaign.end_at && now > campaign.end_at) return false;
  return true;
}

async function evaluateTriggers(
  triggers: readonly AutoTrigger[],
  ctx: EvalContext,
): Promise<number> {
  const rules = (await listAutoRuleRows()).filter(
    (row) =>
      row.is_active === true &&
      row.campaign_id !== null &&
      triggers.includes(row.trigger_type as AutoTrigger),
  );
  let granted = 0;
  for (const rule of rules) {
    try {
      const campaign = rule.campaign_id
        ? await findCampaignRowById(rule.campaign_id)
        : null;
      if (!campaignOpenForGrant(campaign, ctx.now)) continue;
      for (const key of dedupeKeysFor(rule, ctx)) {
        if (await grantFromRule(rule, campaign, ctx.userId, key, ctx.now)) {
          granted += 1;
        }
      }
    } catch {}
  }
  return granted;
}

export async function handleVoucherSignup(userId: string): Promise<void> {
  try {
    await evaluateTriggers(["signup"], {
      userId,
      stats: null,
      now: new Date(),
    });
  } catch {
    return;
  }
}

export async function handleVoucherBookingCompleted(
  userId: string,
  total: number,
): Promise<void> {
  try {
    const now = new Date();
    const stats = await applyCustomerActivity(
      userId,
      { bookings: 1, spent: total },
      now,
    );
    await evaluateTriggers(["booking_count", "spend_total"], {
      userId,
      stats,
      spendDelta: total,
      now,
    });
  } catch {
    return;
  }
}

export async function handleVoucherOrderDelivered(
  userId: string,
  orderId: string,
  total: number,
): Promise<void> {
  try {
    const now = new Date();
    const stats = await applyCustomerActivity(
      userId,
      { orders: 1, spent: total },
      now,
    );
    await evaluateTriggers(["order_count", "order_value", "spend_total"], {
      userId,
      stats,
      orderId,
      orderTotal: total,
      spendDelta: total,
      now,
    });
  } catch {
    return;
  }
}

// A refund unwinds the count and the spend but never claws back an already
// granted voucher — the milestone dedupe rows also keep a re-crossing of
// the same milestone from paying twice.
export async function handleVoucherOrderRefunded(
  userId: string,
  total: number,
): Promise<void> {
  try {
    await applyCustomerActivity(
      userId,
      { orders: -1, spent: -total },
      new Date(),
    );
  } catch {
    return;
  }
}

export async function handleVoucherReviewCreated(
  userId: string,
  reviewRefId: string,
): Promise<void> {
  try {
    await evaluateTriggers(["review_created"], {
      userId,
      stats: null,
      reviewRefId,
      now: new Date(),
    });
  } catch {
    return;
  }
}

// One call per order status change keeps the lifecycle call site a single
// line (delivered ticks the rollup, refunded unwinds it); the customer_id
// null-check lives here so guest orders skip quietly. Best-effort.
export async function handleVoucherOrderTransition(
  row: { customer_id: string | null; order_id: string; total: number | null },
  nextStatus: string,
): Promise<void> {
  try {
    if (!row.customer_id) return;
    if (nextStatus === "delivered") {
      await handleVoucherOrderDelivered(
        row.customer_id,
        row.order_id,
        row.total ?? 0,
      );
    } else if (nextStatus === "refunded") {
      await handleVoucherOrderRefunded(row.customer_id, row.total ?? 0);
    }
  } catch {
    return;
  }
}
