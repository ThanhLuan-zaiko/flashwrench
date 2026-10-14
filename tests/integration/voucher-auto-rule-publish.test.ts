import { beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/vouchers/voucher-realtime", () => ({
  publishCampaignChange: mock(async (_campaignId: string) => {
    published.push(_campaignId);
  }),
}));

import {
  createAutoRule,
  toggleAutoRule,
} from "@/lib/vouchers/auto-rule.service";

const published: string[] = [];

let ruleStore = new Map<string, { campaign_id: string }>();

mock.module("@/lib/vouchers/auto-rule.repository", () => ({
  listAutoRuleRows: mock(async () => []),
  listCustomerStatsRows: mock(async () => []),
  findAutoRuleRowById: mock(async (ruleId: string) => {
    const found = ruleStore.get(ruleId);
    return found ? { rule_id: ruleId, campaign_id: found.campaign_id } : null;
  }),
  insertAutoRule: mock(
    async (params: { ruleId: string; campaignId: string }) => {
      ruleStore.set(params.ruleId, { campaign_id: params.campaignId });
    },
  ),
  setAutoRuleActive: mock(async () => undefined),
}));

mock.module("@/lib/vouchers/voucher-campaign.repository", () => ({
  findCampaignRowById: mock(async (id: string) => ({
    campaign_id: id,
    code: "CODE",
    name: "Campaign",
    is_deleted: false,
  })),
}));

mock.module("@/lib/vouchers/voucher-wallet.service", () => ({
  dispatcherCapAllows: mock(() => null),
}));

beforeEach(() => {
  published.length = 0;
  ruleStore = new Map();
});

describe("voucher auto-rule fan-out", () => {
  test("create and toggle publish for live boards", async () => {
    const actor = { id: "disp-1", role: "dispatcher" as const };
    const campaignId = "11111111-1111-4111-8111-111111111111";
    const created = await createAutoRule(actor, {
      name: "Rule",
      campaignId,
      triggerType: "booking_count",
      threshold: 5,
      windowDays: 30,
      isActive: true,
    });
    expect(created.ok).toBe(true);
    expect(published).toContain(campaignId);

    published.length = 0;
    const ruleId = (created as { data: { id: string } }).data.id;
    const toggled = await toggleAutoRule(actor, ruleId, false);
    expect(toggled.ok).toBe(true);
    expect(published.length).toBeGreaterThan(0);
  });
});
