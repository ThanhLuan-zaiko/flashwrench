// Auto-rule service guards: validation, campaign existence, dispatcher
// caps on wiring/enabling, and the near-milestone board. Storage stays
// untouched on every rejection path.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
  voucherCampaignRepoMocks,
  voucherStubs,
  voucherWalletRepoMocks,
} from "../helpers/service-mocks";
import {
  makeCampaignRow,
  VOUCHER_CAMPAIGN_ID,
} from "../helpers/voucher.fixtures";
import {
  AUTO_RULE_ID,
  makeAutoRuleRow,
  makeCustomerStatsRow,
} from "../helpers/voucher-auto.fixtures";
import {
  autoRuleRepoMocks,
  autoRuleStubs,
} from "../helpers/voucher-auto.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vouchers/auto-rule.repository", () => autoRuleRepoMocks);
mock.module(
  "@/lib/vouchers/voucher-campaign.repository",
  () => voucherCampaignRepoMocks,
);
mock.module(
  "@/lib/vouchers/voucher-wallet.repository",
  () => voucherWalletRepoMocks,
);

import {
  createAutoRule,
  listAutoRules,
  listNearMilestones,
  toggleAutoRule,
} from "@/lib/vouchers/auto-rule.service";

const ADMIN = { id: "admin-1", role: "admin" as const };
const DISPATCHER = { id: "disp-1", role: "dispatcher" as const };

const validInput = {
  name: "Khach quen 5 lan sua",
  campaignId: VOUCHER_CAMPAIGN_ID,
  triggerType: "booking_count" as const,
  threshold: 5,
};

beforeEach(() => {
  resetServiceMocks();
  voucherStubs.campaignById = makeCampaignRow();
  serviceStubs.userById = makeUserRow();
});

describe("createAutoRule", () => {
  test("creates a rule on a grantable campaign", async () => {
    const result = await createAutoRule(DISPATCHER, validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.triggerType).toBe("booking_count");
    expect(result.data.threshold).toBe(5);
    expect(result.data.campaignCode).toBe("CHAO_MUNG");
    expect(autoRuleStubs.insertedRules).toHaveLength(1);
  });

  test("field errors leave storage untouched", async () => {
    const result = await createAutoRule(ADMIN, {
      ...validInput,
      name: " ",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.name).toBeDefined();
    expect(autoRuleStubs.insertedRules).toHaveLength(0);
  });

  test("unknown campaign is a 404, not an insert", async () => {
    voucherStubs.campaignById = null;
    const result = await createAutoRule(ADMIN, validInput);
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(autoRuleStubs.insertedRules).toHaveLength(0);
  });

  test("dispatcher cannot wire an admin-only campaign", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      allow_dispatcher_grant: false,
    });
    const result = await createAutoRule(DISPATCHER, validInput);
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(autoRuleStubs.insertedRules).toHaveLength(0);
  });

  test("dispatcher cannot wire a campaign over their value cap", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      discount_value: 200000,
      dispatcher_max_value: 50000,
    });
    const result = await createAutoRule(DISPATCHER, validInput);
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(autoRuleStubs.insertedRules).toHaveLength(0);
  });

  test("admin wires any campaign regardless of dispatcher cap", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      allow_dispatcher_grant: false,
      discount_value: 999999,
      dispatcher_max_value: 1,
    });
    const result = await createAutoRule(ADMIN, validInput);
    expect(result.ok).toBe(true);
    expect(autoRuleStubs.insertedRules).toHaveLength(1);
  });
});

describe("toggleAutoRule", () => {
  test("rejects a malformed rule id", async () => {
    const result = await toggleAutoRule(ADMIN, "not-a-uuid", true);
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(autoRuleStubs.setActiveCalls).toHaveLength(0);
  });

  test("missing rule is a 404", async () => {
    const result = await toggleAutoRule(ADMIN, AUTO_RULE_ID, true);
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(autoRuleStubs.setActiveCalls).toHaveLength(0);
  });

  test("disabling is always allowed; enabling rechecks the cap", async () => {
    voucherStubs.campaignById = makeCampaignRow({
      allow_dispatcher_grant: false,
    });
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ is_active: true })];

    const off = await toggleAutoRule(DISPATCHER, AUTO_RULE_ID, false);
    expect(off.ok).toBe(true);
    expect(autoRuleStubs.setActiveCalls.at(-1)).toEqual({
      ruleId: AUTO_RULE_ID,
      isActive: false,
    });

    const on = await toggleAutoRule(DISPATCHER, AUTO_RULE_ID, true);
    expect(on).toMatchObject({ ok: false, status: 403 });
  });

  test("enabling fails when the campaign was deleted", async () => {
    voucherStubs.campaignById = null;
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ is_active: false })];
    const result = await toggleAutoRule(ADMIN, AUTO_RULE_ID, true);
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(autoRuleStubs.setActiveCalls).toHaveLength(0);
  });
});

describe("listAutoRules / listNearMilestones", () => {
  test("maps rows with campaign names, newest first", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({
        rule_id: "11111111-1111-4111-8111-111111111111",
        created_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
      makeAutoRuleRow({
        rule_id: AUTO_RULE_ID,
        created_at: new Date("2026-09-05T00:00:00.000Z"),
      }),
    ];
    const result = await listAutoRules();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBe(AUTO_RULE_ID);
    expect(result.data[0]?.campaignName).toBe("Chao mung tai khoan moi");
  });

  test("flags customers one booking below the milestone", async () => {
    autoRuleStubs.ruleRows = [makeAutoRuleRow({ threshold: 5 })];
    autoRuleStubs.statsScanRows = [
      makeCustomerStatsRow({ completed_bookings: 4 }),
      makeCustomerStatsRow({
        customer_id: "22222222-2222-4222-8222-222222222222",
        completed_bookings: 2,
      }),
    ];
    const result = await listNearMilestones();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries).toHaveLength(1);
    expect(result.data.entries[0]?.current).toBe(4);
    expect(result.data.entries[0]?.threshold).toBe(5);
  });

  test("spend rules count as near within 20% of the next milestone", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "spend_total", threshold: 1000000 }),
    ];
    autoRuleStubs.statsScanRows = [
      makeCustomerStatsRow({ total_spent: 850000 }),
      makeCustomerStatsRow({
        customer_id: "22222222-2222-4222-8222-222222222222",
        total_spent: 300000,
      }),
    ];
    const result = await listNearMilestones();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries).toHaveLength(1);
    expect(result.data.entries[0]?.current).toBe(850000);
  });

  test("no active count/spend rules means no scan work", async () => {
    autoRuleStubs.ruleRows = [
      makeAutoRuleRow({ trigger_type: "signup" }),
      makeAutoRuleRow({ trigger_type: "booking_count", is_active: false }),
    ];
    const result = await listNearMilestones();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.entries).toHaveLength(0);
    expect(autoRuleRepoMocks.listCustomerStatsRows.mock.calls).toHaveLength(0);
  });
});
