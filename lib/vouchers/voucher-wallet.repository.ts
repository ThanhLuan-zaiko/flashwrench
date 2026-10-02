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

export type WalletIdPage = {
  ids: string[];
  pageState: string | null;
};

// One partition page of the by_user index. fetchSize/pagesState walk the
// owner's wallet ids newest-first (clustering order) — LIMIT alone would
// silently drop wallets past the cap.
export async function listWalletIdsByUser(
  userId: string,
  limit: number,
  pageState?: string | null,
): Promise<WalletIdPage> {
  const result = await scylla.execute(
    "SELECT wallet_id FROM voucher_wallets_by_user WHERE user_id = ?",
    [userId],
    {
      prepare: true,
      fetchSize: Math.min(Math.max(limit, 1), 100),
      pageState: pageState ?? undefined,
    },
  );
  const ids = result.rows
    .map((row) => (row as unknown as { wallet_id: unknown }).wallet_id)
    .filter((id) => id !== null && id !== undefined)
    .map(String);
  return { ids, pageState: result.pageState ?? null };
}

// Fan-out read of single-partition lookups — the codebase convention for
// id lists (CQL forbids SELECT inside BATCH). Rows come back in the same
// order the caller passed the ids, which is the index's newest-first.
export async function listWalletRowsByIds(
  walletIds: string[],
): Promise<WalletRow[]> {
  if (walletIds.length === 0) return [];
  const results = await Promise.all(
    walletIds.map((walletId) =>
      scylla.execute(
        `SELECT ${COLUMNS} FROM voucher_wallets_by_id WHERE wallet_id = ?`,
        [walletId],
        { prepare: true },
      ),
    ),
  );
  const rows = new Map<string, WalletRow>();
  for (const result of results) {
    const raw = result.first() as unknown as Record<string, unknown> | null;
    if (raw) {
      const row = toRow(raw);
      if (row.wallet_id) rows.set(row.wallet_id, row);
    }
  }
  return walletIds
    .map((id) => rows.get(id))
    .filter((row): row is WalletRow => row !== undefined);
}

export async function countUserWalletsForCampaign(
  userId: string,
  campaignId: string,
): Promise<number> {
  const result = await scylla.execute(
    "SELECT wallet_id, campaign_id FROM voucher_wallets_by_user WHERE user_id = ? LIMIT 500",
    [userId],
    { prepare: true },
  );
  let count = 0;
  for (const raw of result.rows) {
    const row = raw as unknown as WalletUserIndexRow;
    // The driver returns uuid columns as Uuid objects, not strings.
    if (row.campaign_id !== null && String(row.campaign_id) === campaignId) {
      count += 1;
    }
  }
  return count;
}

// Active wallets still live under one campaign — the hard-delete guard.
// Reads only the campaign partition of the audit index; status is a
// regular column there, so the filter stays partition-scoped.
export async function countActiveWalletsForCampaign(
  campaignId: string,
): Promise<number> {
  const result = await scylla.execute(
    "SELECT status FROM voucher_wallets_by_campaign WHERE campaign_id = ? LIMIT 2000",
    [campaignId],
    { prepare: true },
  );
  let count = 0;
  for (const raw of result.rows) {
    const row = raw as unknown as { status: string | null };
    if (row.status === "active") count += 1;
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
  grantedBy: string | null;
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

export type WalletTransitionParams = {
  walletId: string;
  userId: string;
  campaignId: string | null;
  grantedAt: Date;
  status: string;
  usedAt: Date | null;
  usedOrderId: string | null;
  usedBookingId: string | null;
  // CAS guards on the by_id row: the transition only lands when the
  // stored row still matches every expectation (e.g. status = 'active',
  // used_order_id = the ref being refunded). Null expectations are
  // skipped — a missing ref means "don't check that column".
  expectStatus?: string;
  expectUsedOrderId?: string | null;
  expectUsedBookingId?: string | null;
};

// Mirror one status into an index table. Index rows are audit mirrors of
// by_id, so a hiccup must not fail the committed transition — retry a few
// times, then let the next transition resync the row. Never throws.
async function mirrorWalletStatus(
  query: string,
  params: unknown[],
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await scylla.execute(query, params, { prepare: true });
      return;
    } catch {
      if (attempt === 2) return;
    }
  }
}

// Atomic status flip: the LWT on the by_id row is the serialization
// point, so two concurrent spends can never both win a wallet. Index
// mirrors update best-effort after the CAS lands — by_id is the truth.
export async function commitWalletTransition(
  params: WalletTransitionParams,
): Promise<boolean> {
  const conditions: string[] = [];
  const conditionParams: unknown[] = [];
  if (params.expectStatus !== undefined) {
    conditions.push("status = ?");
    conditionParams.push(params.expectStatus);
  }
  if (params.expectUsedOrderId != null) {
    conditions.push("used_order_id = ?");
    conditionParams.push(params.expectUsedOrderId);
  }
  if (params.expectUsedBookingId != null) {
    conditions.push("used_booking_id = ?");
    conditionParams.push(params.expectUsedBookingId);
  }
  const conditional =
    conditions.length > 0 ? ` IF ${conditions.join(" AND ")}` : "";
  const result = await scylla.execute(
    `UPDATE voucher_wallets_by_id SET status = ?, used_at = ?, used_order_id = ?, used_booking_id = ? WHERE wallet_id = ?${conditional}`,
    [
      params.status,
      params.usedAt,
      params.usedOrderId,
      params.usedBookingId,
      params.walletId,
      ...conditionParams,
    ],
    { prepare: true },
  );
  if (conditions.length > 0 && !result.wasApplied()) return false;
  await Promise.all([
    mirrorWalletStatus(
      "UPDATE voucher_wallets_by_user SET status = ? WHERE user_id = ? AND granted_at = ? AND wallet_id = ?",
      [params.status, params.userId, params.grantedAt, params.walletId],
    ),
    params.campaignId
      ? mirrorWalletStatus(
          "UPDATE voucher_wallets_by_campaign SET status = ? WHERE campaign_id = ? AND granted_at = ? AND wallet_id = ?",
          [params.status, params.campaignId, params.grantedAt, params.walletId],
        )
      : Promise.resolve(),
  ]);
  return true;
}
