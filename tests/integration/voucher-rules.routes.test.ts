// Dispatch voucher-rule routes: role guard, request parsing and error
// pass-through. Services are stubbed; the handlers only shape responses.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import { authorizationMocks, routeStubs } from "../helpers/route-mocks";
import { VOUCHER_CAMPAIGN_ID } from "../helpers/voucher.fixtures";
import { makeVoucherAutoRule } from "../helpers/voucher-auto.fixtures";
import {
  autoRuleRouteStubs,
  autoRuleServiceMocks,
} from "../helpers/voucher-auto.mocks";

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/vouchers/auto-rule.service", () => autoRuleServiceMocks);

import { GET as progressGet } from "@/app/api/dispatch/voucher-progress/route";
import { PATCH as rulePatch } from "@/app/api/dispatch/voucher-rules/[ruleId]/route";
import {
  GET as rulesGet,
  POST as rulesPost,
} from "@/app/api/dispatch/voucher-rules/route";

const RULE_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const DISPATCHER = makePublicUser({ role: "dispatcher" });

function patchParams(ruleId: string) {
  return { params: Promise.resolve({ ruleId }) };
}

beforeEach(() => {
  autoRuleRouteStubs.listResult = null;
  autoRuleRouteStubs.createResult = null;
  autoRuleRouteStubs.toggleResult = null;
  autoRuleRouteStubs.nearResult = null;
  routeStubs.bookingUser = DISPATCHER;
  for (const fn of Object.values(autoRuleServiceMocks)) fn.mockClear();
});

describe("GET /api/dispatch/voucher-rules", () => {
  test("anonymous and customer roles are rejected", async () => {
    routeStubs.bookingUser = null;
    expect((await rulesGet()).status).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    expect((await rulesGet()).status).toBe(403);
    expect(autoRuleServiceMocks.listAutoRules.mock.calls).toHaveLength(0);
  });

  test("dispatchers and admins list rules", async () => {
    autoRuleRouteStubs.listResult = {
      ok: true,
      data: [makeVoucherAutoRule()],
    };
    const res = await rulesGet();
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      rules: [{ id: RULE_ID }],
    });

    routeStubs.bookingUser = makePublicUser({ role: "admin" });
    expect((await rulesGet()).status).toBe(200);
  });
});

describe("POST /api/dispatch/voucher-rules", () => {
  const body = {
    name: "Khach quen",
    campaignId: VOUCHER_CAMPAIGN_ID,
    triggerType: "booking_count",
    threshold: 5,
  };

  test("passes service field errors through with 400", async () => {
    autoRuleRouteStubs.createResult = {
      ok: false,
      status: 400,
      errors: { threshold: "Nhập mốc hợp lệ (số nguyên dương)." },
    };
    const res = await rulesPost(
      postJsonRequest("/api/dispatch/voucher-rules", body),
    );
    expect(res.status).toBe(400);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { threshold: "Nhập mốc hợp lệ (số nguyên dương)." },
    });
  });

  test("returns 201 with the created rule", async () => {
    autoRuleRouteStubs.createResult = {
      ok: true,
      data: makeVoucherAutoRule(),
    };
    const res = await rulesPost(
      postJsonRequest("/api/dispatch/voucher-rules", body),
    );
    expect(res.status).toBe(201);
    const [actor, input] =
      autoRuleServiceMocks.createAutoRule.mock.calls[0] ?? [];
    expect(actor).toMatchObject({ id: DISPATCHER.id, role: "dispatcher" });
    expect(input).toMatchObject({
      name: "Khach quen",
      campaignId: VOUCHER_CAMPAIGN_ID,
      triggerType: "booking_count",
      threshold: 5,
    });
  });
});

describe("PATCH /api/dispatch/voucher-rules/[ruleId]", () => {
  test("toggles a rule through the service", async () => {
    autoRuleRouteStubs.toggleResult = {
      ok: true,
      data: makeVoucherAutoRule({ isActive: false }),
    };
    const res = await rulePatch(
      postJsonRequest(`/api/dispatch/voucher-rules/${RULE_ID}`, {
        isActive: false,
      }),
      patchParams(RULE_ID),
    );
    expect(res.status).toBe(200);
    const call = autoRuleServiceMocks.toggleAutoRule.mock.calls[0];
    expect(call?.[1]).toBe(RULE_ID);
    expect(call?.[2]).toBe(false);
  });

  test("a missing rule surfaces the service 404", async () => {
    autoRuleRouteStubs.toggleResult = {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy quy tắc." },
    };
    const res = await rulePatch(
      postJsonRequest(`/api/dispatch/voucher-rules/${RULE_ID}`, {
        isActive: true,
      }),
      patchParams(RULE_ID),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/dispatch/voucher-progress", () => {
  test("returns the near-milestone board", async () => {
    autoRuleRouteStubs.nearResult = {
      ok: true,
      data: {
        entries: [
          {
            userId: "u1",
            ruleId: RULE_ID,
            ruleName: "Khach quen",
            triggerType: "booking_count",
            current: 4,
            threshold: 5,
          },
        ],
        scannedCustomers: 12,
        truncated: false,
      },
    };
    const res = await progressGet();
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      scannedCustomers: 12,
      entries: [{ current: 4, threshold: 5 }],
    });
  });

  test("customers cannot read the progress board", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    expect((await progressGet()).status).toBe(403);
  });
});
