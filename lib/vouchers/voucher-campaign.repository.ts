// Raw CQL for voucher campaigns. No business logic here.
import { scylla } from "@/lib/db/client";
import type { CampaignRow } from "./voucher.types";

function toRow(raw: Record<string, unknown>): CampaignRow {
  return {
    campaign_id: String(raw.campaign_id),
    code: (raw.code as string | null) ?? null,
    name: (raw.name as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    image_url: (raw.image_url as string | null) ?? null,
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
    created_by: raw.created_by ? String(raw.created_by) : null,
    created_at: (raw.created_at as Date | null) ?? null,
    updated_at: (raw.updated_at as Date | null) ?? null,
  };
}

const COLUMNS =
  "campaign_id, code, name, description, image_url, discount_type, discount_value, max_discount, min_order, scope, start_at, end_at, total_limit, granted_count, per_user_limit, allow_dispatcher_grant, dispatcher_max_value, is_active, created_by, created_at, updated_at";

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

export type InsertCampaignParams = {
  campaignId: string;
  code: string;
  name: string;
  description: string;
  imageUrl: string;
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
          "INSERT INTO voucher_campaigns_by_id (campaign_id, code, name, description, image_url, discount_type, discount_value, max_discount, min_order, scope, start_at, end_at, total_limit, granted_count, per_user_limit, allow_dispatcher_grant, dispatcher_max_value, is_active, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.campaignId,
          params.code,
          params.name,
          params.description,
          params.imageUrl,
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

export type UpdateCampaignParams = InsertCampaignParams & { now: Date };

export async function updateCampaignRows(
  params: UpdateCampaignParams,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET name = ?, description = ?, image_url = ?, discount_type = ?, discount_value = ?, max_discount = ?, min_order = ?, scope = ?, start_at = ?, end_at = ?, total_limit = ?, per_user_limit = ?, allow_dispatcher_grant = ?, dispatcher_max_value = ?, is_active = ?, updated_at = ? WHERE campaign_id = ?",
    [
      params.name,
      params.description,
      params.imageUrl,
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
      params.now,
      params.campaignId,
    ],
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

export async function bumpGrantedCount(
  campaignId: string,
  delta: number,
): Promise<void> {
  await scylla.execute(
    "UPDATE voucher_campaigns_by_id SET granted_count = granted_count + ? WHERE campaign_id = ?",
    [delta, campaignId],
    { prepare: true },
  );
}
