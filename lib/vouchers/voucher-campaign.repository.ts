// Raw CQL for voucher campaigns. No business logic here.
import { scylla } from "@/lib/db/client";
import type { CampaignRow } from "./voucher.types";

function toRow(raw: Record<string, unknown>): CampaignRow {
  return {
    campaign_id: String(raw.campaign_id),
    code: (raw.code as string | null) ?? null,
    redeem_code: (raw.redeem_code as string | null) ?? null,
    slug: (raw.slug as string | null) ?? null,
    name: (raw.name as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
    images: Array.isArray(raw.images)
      ? (raw.images as unknown[]).filter(
          (u): u is string => typeof u === "string",
        )
      : null,
    discount_type: (raw.discount_type as string | null) ?? null,
    discount_value: (raw.discount_value as number | null) ?? null,
    max_discount: (raw.max_discount as number | null) ?? null,
    min_order: (raw.min_order as number | null) ?? null,
    scope: (raw.scope as string | null) ?? null,
    start_at: (raw.start_at as Date | null) ?? null,
    end_at: (raw.end_at as Date | null) ?? null,
    total_limit: (raw.total_limit as number | null) ?? null,
    granted_count: (raw.granted_count as number | null) ?? null,
    per_user_limit: (raw.per_user_limit as number | null) ?? null,
    allow_dispatcher_grant:
      (raw.allow_dispatcher_grant as boolean | null) ?? null,
    dispatcher_max_value: (raw.dispatcher_max_value as number | null) ?? null,
    is_active: (raw.is_active as boolean | null) ?? null,
    is_deleted: (raw.is_deleted as boolean | null) ?? null,
    deleted_at: (raw.deleted_at as Date | null) ?? null,
    created_by: raw.created_by ? String(raw.created_by) : null,
    created_at: (raw.created_at as Date | null) ?? null,
    updated_at: (raw.updated_at as Date | null) ?? null,
  };
}

const COLUMNS =
  "campaign_id, code, redeem_code, slug, name, description, image_url, images, discount_type, discount_value, max_discount, min_order, scope, start_at, end_at, total_limit, granted_count, per_user_limit, allow_dispatcher_grant, dispatcher_max_value, is_active, is_deleted, deleted_at, created_by, created_at, updated_at";

export async function listCampaignRows(): Promise<CampaignRow[]> {
  const result = await scylla.execute(
    `SELECT ${COLUMNS} FROM voucher_campaigns_by_id`,
    [],
    { prepare: true },
  );
  return result.rows.map((row) =>
    toRow(row as unknown as Record<string, unknown>),
  );
}

export async function findCampaignRowById(
  campaignId: string,
): Promise<CampaignRow | null> {
  const result = await scylla.execute(
    `SELECT ${COLUMNS} FROM voucher_campaigns_by_id WHERE campaign_id = ?`,
    [campaignId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toRow(row) : null;
}

export async function findCampaignIdByCode(
  code: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT campaign_id FROM voucher_campaigns_by_code WHERE code = ?",
    [code],
    { prepare: true },
  );
  const row = result.first() as unknown as { campaign_id: unknown } | null;
  return row?.campaign_id ? String(row.campaign_id) : null;
}

export async function findCampaignIdBySlug(
  slug: string,
): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT campaign_id FROM voucher_campaigns_by_slug WHERE slug = ?",
    [slug],
    { prepare: true },
  );
  const row = result.first() as unknown as { campaign_id: unknown } | null;
  return row?.campaign_id ? String(row.campaign_id) : null;
}

export type InsertCampaignParams = {
  campaignId: string;
  code: string;
  redeemCode: string | null;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  images: string[];
  discountType: string;
  discountValue: number;
  maxDiscount: number;
  minOrder: number;
  scope: string;
  startAt: Date | null;
  endAt: Date | null;
  totalLimit: number;
  perUserLimit: number;
  allowDispatcherGrant: boolean;
  dispatcherMaxValue: number;
  isActive: boolean;
  createdBy: string;
  now: Date;
};

export async function insertCampaign(
  params: InsertCampaignParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO voucher_campaigns_by_id (campaign_id, code, redeem_code, slug, name, description, image_url, images, discount_type, discount_value, max_discount, min_order, scope, start_at, end_at, total_limit, granted_count, per_user_limit, allow_dispatcher_grant, dispatcher_max_value, is_active, is_deleted, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, false, ?, ?, ?)",
        params: [
          params.campaignId,
          params.code,
          params.redeemCode,
          params.slug,
          params.name,
          params.description,
          params.imageUrl,
          params.images,
          params.discountType,
          params.discountValue,
          params.maxDiscount,
          params.minOrder,
          params.scope,
          params.startAt,
          params.endAt,
          params.totalLimit,
          params.perUserLimit,
          params.allowDispatcherGrant,
          params.dispatcherMaxValue,
          params.isActive,
          params.createdBy,
          params.now,
          params.now,
        ],
      },
      {
        query:
          "INSERT INTO voucher_campaigns_by_code (code, campaign_id) VALUES (?, ?)",
        params: [params.code, params.campaignId],
      },
      {
        query:
          "INSERT INTO voucher_campaigns_by_slug (slug, campaign_id) VALUES (?, ?)",
        params: [params.slug, params.campaignId],
      },
    ],
    { prepare: true },
  );
}

export async function claimCampaignCode(
  code: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_campaigns_by_code (code, campaign_id) VALUES (?, ?) IF NOT EXISTS",
    [code, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releaseCampaignCode(
  code: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM voucher_campaigns_by_code WHERE code = ? IF campaign_id = ?",
    [code, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function claimCampaignSlug(
  slug: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO voucher_campaigns_by_slug (slug, campaign_id) VALUES (?, ?) IF NOT EXISTS",
    [slug, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

export async function releaseCampaignSlug(
  slug: string,
  campaignId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "DELETE FROM voucher_campaigns_by_slug WHERE slug = ? IF campaign_id = ?",
    [slug, campaignId],
    { prepare: true },
  );
  return result.wasApplied();
}

export type UpdateCampaignParams = InsertCampaignParams & { now: Date };

export async function updateCampaignRows(
  params: UpdateCampaignParams,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET name = ?, description = ?, image_url = ?, images = ?, discount_type = ?, discount_value = ?, max_discount = ?, min_order = ?, scope = ?, start_at = ?, end_at = ?, total_limit = ?, per_user_limit = ?, allow_dispatcher_grant = ?, dispatcher_max_value = ?, is_active = ?, redeem_code = ?, updated_at = ? WHERE campaign_id = ?",
    [
      params.name,
      params.description,
      params.imageUrl,
      params.images,
      params.discountType,
      params.discountValue,
      params.maxDiscount,
      params.minOrder,
      params.scope,
      params.startAt,
      params.endAt,
      params.totalLimit,
      params.perUserLimit,
      params.allowDispatcherGrant,
      params.dispatcherMaxValue,
      params.isActive,
      params.redeemCode,
      params.now,
      params.campaignId,
    ],
    { prepare: true },
  );
}

// Single-column write for the dispatcher redeem-code editor.
export async function updateCampaignRedeemCode(
  campaignId: string,
  redeemCode: string | null,
  now: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET redeem_code = ?, updated_at = ? WHERE campaign_id = ?",
    [redeemCode, now, campaignId],
    { prepare: true },
  );
}

export async function setCampaignActive(
  campaignId: string,
  isActive: boolean,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET is_active = ?, updated_at = ? WHERE campaign_id = ?",
    [isActive, new Date(), campaignId],
    { prepare: true },
  );
}

export async function setCampaignDeleted(
  campaignId: string,
  isDeleted: boolean,
  deletedAt: Date | null,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET is_deleted = ?, deleted_at = ?, updated_at = ? WHERE campaign_id = ?",
    [isDeleted, deletedAt, new Date(), campaignId],
    { prepare: true },
  );
}

// Permanent removal: the campaign row plus both uniqueness claims. Rows
// that reference the campaign (wallets, rules) keep their denormalized
// copies — the service blocks this while any wallet stays active.
export async function hardDeleteCampaign(params: {
  campaignId: string;
  code: string;
  slug: string;
}): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM voucher_campaigns_by_id WHERE campaign_id = ?",
        params: [params.campaignId],
      },
      {
        query: "DELETE FROM voucher_campaigns_by_code WHERE code = ?",
        params: [params.code],
      },
      {
        query: "DELETE FROM voucher_campaigns_by_slug WHERE slug = ?",
        params: [params.slug],
      },
    ],
    { prepare: true },
  );
}

export type GrantSlotOutcome = "ok" | "limit" | "error";

// Grant a single slot with the ceiling enforced atomically: regular
// columns cannot do `count = count + 1` in CQL, so the increment is a
// read + CAS (`IF granted_count = ?`). A lost race retries; hitting the
// limit or exhausting retries fails closed so grants never overshoot.
export async function claimGrantSlot(
  campaignId: string,
  totalLimit: number,
): Promise<GrantSlotOutcome> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await findCampaignRowById(campaignId);
    if (!row || row.granted_count === null) return "error";
    const current = row.granted_count;
    if (totalLimit > 0 && current >= totalLimit) return "limit";
    const result = await scylla.execute(
      "UPDATE voucher_campaigns_by_id SET granted_count = ?, updated_at = ? WHERE campaign_id = ? IF granted_count = ?",
      [current + 1, new Date(), campaignId, current],
      { prepare: true },
    );
    if (result.wasApplied()) return "ok";
  }
  return "error";
}

// Undo a claimed slot when the wallet insert dies right after. Same CAS
// shape as claimGrantSlot; best-effort — overshooting the ceiling is a
// bug, undershooting by one orphaned slot is not.
export async function releaseGrantSlot(campaignId: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await findCampaignRowById(campaignId);
    if (!row || row.granted_count === null || row.granted_count <= 0) {
      return;
    }
    const result = await scylla.execute(
      "UPDATE voucher_campaigns_by_id SET granted_count = ?, updated_at = ? WHERE campaign_id = ? IF granted_count = ?",
      [row.granted_count - 1, new Date(), campaignId, row.granted_count],
      { prepare: true },
    );
    if (result.wasApplied()) return;
  }
}
