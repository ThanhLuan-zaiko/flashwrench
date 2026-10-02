// Shared rows for the auto-grant suites: one booking_count rule and one
// customer stats row halfway to its milestone.
import type {
  AutoRuleRow,
  CustomerStatsRow,
  VoucherAutoRule,
} from "@/lib/vouchers/auto-rule.types";
import { VOUCHER_CAMPAIGN_ID, VOUCHER_CUSTOMER_ID } from "./voucher.fixtures";

export const AUTO_RULE_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

export function makeAutoRuleRow(overrides?: Partial<AutoRuleRow>): AutoRuleRow {
  return {
    rule_id: AUTO_RULE_ID,
    name: "Khach quen 5 lan sua",
    campaign_id: VOUCHER_CAMPAIGN_ID,
    trigger_type: "booking_count",
    threshold: 5,
    window_days: 0,
    is_active: true,
    granted_count: 0,
    created_by: "admin-1",
    created_at: new Date("2026-09-01T00:00:00.000Z"),
    updated_at: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeCustomerStatsRow(
  overrides?: Partial<CustomerStatsRow>,
): CustomerStatsRow {
  return {
    customer_id: VOUCHER_CUSTOMER_ID,
    completed_bookings: 4,
    completed_orders: 0,
    total_spent: 800000,
    last_activity_at: new Date("2026-09-10T00:00:00.000Z"),
    updated_at: new Date("2026-09-10T00:00:00.000Z"),
    ...overrides,
  };
}

// The public shape route tests hand back through the service mock.
export function makeVoucherAutoRule(
  overrides?: Partial<VoucherAutoRule>,
): VoucherAutoRule {
  return {
    id: AUTO_RULE_ID,
    name: "Khach quen 5 lan sua",
    campaignId: VOUCHER_CAMPAIGN_ID,
    campaignCode: "CHAO_MUNG",
    campaignName: "Chao mung tai khoan moi",
    triggerType: "booking_count",
    threshold: 5,
    windowDays: 0,
    isActive: true,
    grantedCount: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}
