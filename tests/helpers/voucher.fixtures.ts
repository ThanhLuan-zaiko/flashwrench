// Shared rows for the voucher wallet suites: one order-scope fixed
// campaign and one wallet owned by the default customer.
import type { CampaignRow, WalletRow } from "@/lib/vouchers/voucher.types";

export const VOUCHER_CAMPAIGN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const VOUCHER_WALLET_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const VOUCHER_CUSTOMER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

export function makeCampaignRow(overrides?: Partial<CampaignRow>): CampaignRow {
  return {
    campaign_id: VOUCHER_CAMPAIGN_ID,
    code: "CHAO_MUNG",
    slug: "chao-mung",
    name: "Chao mung tai khoan moi",
    description: "",
    image_url: "",
    images: null,
    discount_type: "fixed",
    discount_value: 50000,
    max_discount: 0,
    min_order: 100000,
    scope: "order",
    start_at: null,
    end_at: null,
    total_limit: 100,
    granted_count: 0,
    per_user_limit: 1,
    allow_dispatcher_grant: true,
    dispatcher_max_value: 50000,
    is_active: true,
    is_deleted: false,
    deleted_at: null,
    created_by: "admin-1",
    created_at: new Date("2026-09-01T00:00:00.000Z"),
    updated_at: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeWalletRow(overrides?: Partial<WalletRow>): WalletRow {
  return {
    wallet_id: VOUCHER_WALLET_ID,
    user_id: VOUCHER_CUSTOMER_ID,
    campaign_id: VOUCHER_CAMPAIGN_ID,
    campaign_code: "CHAO_MUNG",
    campaign_name: "Chao mung tai khoan moi",
    image_url: "",
    discount_type: "fixed",
    discount_value: 50000,
    max_discount: 0,
    status: "active",
    granted_by: "admin-1",
    grant_note: "",
    granted_at: new Date("2026-09-02T00:00:00.000Z"),
    expires_at: null,
    used_at: null,
    used_order_id: null,
    used_booking_id: null,
    ...overrides,
  };
}
