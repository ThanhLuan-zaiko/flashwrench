// Raw CQL for account-bound voucher wallets. No business logic here.
import { scylla } from "@/lib/db/client";
import type { WalletRow, WalletUserIndexRow } from "./voucher.types";

function toRow(raw: Record<string, unknown>): WalletRow {
  return {
    wallet_id: String(raw.wallet_id),
    user_id: String(raw.user_id),
    campaign_id: raw.campaign_id ? String(raw.campaign_id) : null,
    campaign_code: (raw.campaign_code as string | null) ?? null,
    campaign_name: (raw.campaign_name as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
    discount_type: (raw.discount_type as string | null) ?? null,
    discount_value: (raw.discount_value as number | null) ?? null,
    max_discount: (raw.max_discount as number | null) ?? null,
    status: (raw.status as string | null) ?? null,
    granted_by: raw.granted_by ? String(raw.granted_by) : null,
    grant_note: (raw.grant_note as string | null) ?? null,
    granted_at: (raw.granted_at as Date | null) ?? null,
    expires_at: (raw.expires_at as Date | null) ?? null,
    used_at: (raw.used_at as Date | null) ?? null,
    used_order_id: raw.used_order_id ? String(raw.used_order_id) : null,
    used_booking_id: raw.used_booking_id ? String(raw.used_booking_id) : null,
  };
}

const COLUMNS =
  "wallet_id, user_id, campaign_id, campaign_code, campaign_name, image_url, discount_type, discount_value, max_discount, status, granted_by, grant_note, granted_at, expires_at, used_at, used_order_id, used_booking_id";

export async function findWalletRowById(
  walletId: string,
): Promise<WalletRow | null> {
  const result = await scylla.execute(
    `SELECT ${COLUMNS} FROM voucher_wallets_by_id WHERE wallet_id = ?`,
    [walletId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toRow(row) : null;
}

export async function listWalletRowsByUser(
  userId: string,
  limit = 50,
): Promise<WalletRow[]> {
  const index = await scylla.execute(
    "SELECT wallet_id FROM voucher_wallets_by_user WHERE user_id = ? LIMIT ?",
    [userId, Math.min(Math.max(limit, 1), 100)],
    { prepare: true },
  );
  const ids = index.rows
    .map((row) => (row as unknown as { wallet_id: unknown }).wallet_id)
    .filter((id): id is string => typeof id === "string" || id !== null)
    .map(String);
  const wallets: WalletRow[] = [];
  for (const id of ids) {
    const row = await findWalletRowById(id);
    if (row) wallets.push(row);
  }
  return wallets.sort((a, b) => {
    const at = a.granted_at?.getTime() ?? 0;
    const bt = b.granted_at?.getTime() ?? 0;
    return bt - at;
  });
}

export async function countUserWalletsForCampaign(
  userId: string,
  campaignId: string,
): Promise<number> {
  const result = await scylla.execute(
    "SELECT wallet_id, campaign_id FROM voucher_wallets_by_user WHERE user_id = ? LIMIT 100",
    [userId],
    { prepare: true },
  );
  let count = 0;
  for (const raw of result.rows) {
    const row = raw as unknown as WalletUserIndexRow;
    if (row.campaign_id === campaignId) count += 1;
  }
  return count;
}

export type InsertWalletParams = {
  walletId: string;
  userId: string;
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  imageUrl: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number;
  grantedBy: string;
  grantNote: string;
  grantedAt: Date;
  expiresAt: Date | null;
};

export async function insertWallet(params: InsertWalletParams): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO voucher_wallets_by_id (wallet_id, user_id, campaign_id, campaign_code, campaign_name, image_url, discount_type, discount_value, max_discount, status, granted_by, grant_note, granted_at, expires_at, used_at, used_order_id, used_booking_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, null, null, null)",
        params: [
          params.walletId,
          params.userId,
          params.campaignId,
          params.campaignCode,
          params.campaignName,
          params.imageUrl,
          params.discountType,
          params.discountValue,
          params.maxDiscount,
          params.grantedBy,
          params.grantNote,
          params.grantedAt,
          params.expiresAt,
        ],
      },
      {
        query:
          "INSERT INTO voucher_wallets_by_user (user_id, granted_at, wallet_id, campaign_id, status) VALUES (?, ?, ?, ?, 'active')",
        params: [
          params.userId,
          params.grantedAt,
          params.walletId,
          params.campaignId,
        ],
      },
      {
        query:
          "INSERT INTO voucher_wallets_by_campaign (campaign_id, granted_at, wallet_id, user_id, status) VALUES (?, ?, ?, ?, 'active')",
        params: [
          params.campaignId,
          params.grantedAt,
          params.walletId,
          params.userId,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function markWalletStatus(params: {
  walletId: string;
  userId: string;
  campaignId: string | null;
  grantedAt: Date;
  status: string;
  usedAt: Date | null;
  usedOrderId: string | null;
  usedBookingId: string | null;
}): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "UPDATE voucher_wallets_by_id SET status = ?, used_at = ?, used_order_id = ?, used_booking_id = ? WHERE wallet_id = ?",
        params: [
          params.status,
          params.usedAt,
          params.usedOrderId,
          params.usedBookingId,
          params.walletId,
        ],
      },
      {
        query:
          "UPDATE voucher_wallets_by_user SET status = ? WHERE user_id = ? AND granted_at = ? AND wallet_id = ?",
        params: [
          params.status,
          params.userId,
          params.grantedAt,
          params.walletId,
        ],
      },
    ],
    { prepare: true },
  );
  if (params.campaignId) {
    await scylla
      .execute(
        "UPDATE voucher_wallets_by_campaign SET status = ? WHERE campaign_id = ? AND granted_at = ? AND wallet_id = ?",
        [params.status, params.campaignId, params.grantedAt, params.walletId],
        { prepare: true },
      )
      .catch(() => undefined);
  }
}
