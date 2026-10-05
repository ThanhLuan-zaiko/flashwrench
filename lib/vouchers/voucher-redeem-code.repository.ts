// Raw CQL for typed redeem codes and their short-lived claim locks.
// No business logic here.
import { scylla } from "@/lib/db/client";

export async function findCampaignIdByRedeemCode(
  code: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT campaign_id FROM voucher_campaigns_by_redeem_code WHERE redeem_code = ?",
    [code],
    { prepare: true },
  );
  const row = result.first() as unknown as { campaign_id: unknown } | null;
  return row?.campaign_id ? String(row.campaign_id) : null;
}

// LWT claim: one campaign owns each redeem code globally.
export async function claimRedeemCode(
  code: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_campaigns_by_redeem_code (redeem_code, campaign_id) VALUES (?, ?) IF NOT EXISTS",
    [code, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releaseRedeemCode(
  code: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM voucher_campaigns_by_redeem_code WHERE redeem_code = ? IF campaign_id = ?",
    [code, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

// One lock row per (campaign, user, seq) with a 10-minute TTL: parallel
// claims race on the same seq so a burst can never exceed per_user_limit,
// and orphans clean themselves up.
export async function claimCodeClaimLock(params: {
  campaignId: string;
  userId: string;
  seq: number;
  walletId: string;
  claimedAt: Date;
}): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_code_claims (campaign_id, user_id, seq, wallet_id, claimed_at) VALUES (?, ?, ?, ?, ?) IF NOT EXISTS USING TTL 600",
    [
      params.campaignId,
      params.userId,
      params.seq,
      params.walletId,
      params.claimedAt,
    ],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releaseCodeClaimLock(
  campaignId: string,
  userId: string,
  seq: number,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM voucher_code_claims WHERE campaign_id = ? AND user_id = ? AND seq = ?",
    [campaignId, userId, seq],
    { prepare: true },
  );
}
