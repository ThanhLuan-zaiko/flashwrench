// Dispatch redeem-code route: role guard, body parsing and error
// pass-through. The service and realtime publisher are stubbed; the
// handler only shapes responses.
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { toCampaign } from "@/lib/vouchers/voucher.mapper";
import type {
  VoucherCampaign,
  VoucherResult,
} from "@/lib/vouchers/voucher.types";
import { makePublicUser, readJsonBody } from "../helpers/auth.fixtures";
import { authorizationMocks, routeStubs } from "../helpers/route-mocks";
import {
  makeCampaignRow,
  VOUCHER_CAMPAIGN_ID,
} from "../helpers/voucher.fixtures";
import { voucherRealtimeMocks } from "../helpers/voucher.mocks";

const codeRouteStubs = {
  result: null as VoucherResult<VoucherCampaign> | null,
};

const redeemCodeServiceMocks = {
  setCampaignRedeemCode: mock(
    async (
      _campaignId: string,
      _rawCode: unknown,
    ): Promise<VoucherResult<VoucherCampaign>> =>
      codeRouteStubs.result ?? {
        ok: true,
        data: toCampaign(makeCampaignRow({ redeem_code: "KHACHHANG" })),
      },
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/vouchers/voucher-realtime", () => voucherRealtimeMocks);
mock.module(
  "@/lib/vouchers/voucher-redeem-code.service",
  () => redeemCodeServiceMocks,
);

import { PATCH } from "@/app/api/dispatch/voucher-campaigns/[campaignId]/code/route";

// Defensive cleanup: when several files share one `bun test` process,
// mock.module registrations can leak across files — restore the real
// modules once these route tests are done.
afterAll(() => mock.restore());

const DISPATCHER = makePublicUser({ role: "dispatcher" });
const ROUTE_PARAMS = {
  params: Promise.resolve({ campaignId: VOUCHER_CAMPAIGN_ID }),
};

function patchJsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  routeStubs.bookingUser = DISPATCHER;
  codeRouteStubs.result = null;
  redeemCodeServiceMocks.setCampaignRedeemCode.mockClear();
  voucherRealtimeMocks.publishCampaignChange.mockClear();
});

describe("PATCH /api/dispatch/voucher-campaigns/[campaignId]/code", () => {
  test("anonymous callers get 401, customers get 403", async () => {
    routeStubs.bookingUser = null;
    const anon = await PATCH(patchJsonRequest("/x", {}), ROUTE_PARAMS);
    expect(anon.status).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    const denied = await PATCH(patchJsonRequest("/x", {}), ROUTE_PARAMS);
    expect(denied.status).toBe(403);
    expect(redeemCodeServiceMocks.setCampaignRedeemCode).not.toHaveBeenCalled();
  });

  test("a dispatcher updates the code through the service", async () => {
    const res = await PATCH(
      patchJsonRequest(
        `/api/dispatch/voucher-campaigns/${VOUCHER_CAMPAIGN_ID}/code`,
        {
          redeemCode: "khach hang",
        },
      ),
      ROUTE_PARAMS,
    );
    expect(res.status).toBe(200);
    const body = (await readJsonBody(res)) as {
      campaign: VoucherCampaign;
    };
    expect(body.campaign.redeemCode).toBe("KHACHHANG");
    const call = redeemCodeServiceMocks.setCampaignRedeemCode.mock.calls[0];
    expect(call?.[0]).toBe(VOUCHER_CAMPAIGN_ID);
    expect(call?.[1]).toBe("khach hang");
    expect(voucherRealtimeMocks.publishCampaignChange).toHaveBeenCalledWith(
      VOUCHER_CAMPAIGN_ID,
    );
  });

  test("an admin gets the same access", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "admin" });
    const res = await PATCH(
      patchJsonRequest("/x", { redeemCode: "ABC123" }),
      ROUTE_PARAMS,
    );
    expect(res.status).toBe(200);
  });

  test("a missing or empty redeemCode removes the code", async () => {
    const res = await PATCH(patchJsonRequest("/x", {}), ROUTE_PARAMS);
    expect(res.status).toBe(200);
    const call = redeemCodeServiceMocks.setCampaignRedeemCode.mock.calls[0];
    expect(call?.[1]).toBe("");
  });

  test("service field errors pass through with their status", async () => {
    codeRouteStubs.result = {
      ok: false,
      status: 400,
      errors: {
        redeemCode: "Mã nhập tay gồm 4–20 chữ cái không dấu hoặc chữ số.",
      },
    };
    const res = await PATCH(
      patchJsonRequest("/x", { redeemCode: "ab" }),
      ROUTE_PARAMS,
    );
    expect(res.status).toBe(400);
    expect(await readJsonBody(res)).toMatchObject({
      errors: {
        redeemCode: "Mã nhập tay gồm 4–20 chữ cái không dấu hoặc chữ số.",
      },
    });
    expect(voucherRealtimeMocks.publishCampaignChange).not.toHaveBeenCalled();
  });

  test("a malformed body returns 400 before the service runs", async () => {
    const res = await PATCH(patchJsonRequest("/x", "{not-json"), ROUTE_PARAMS);
    expect(res.status).toBe(400);
    expect(redeemCodeServiceMocks.setCampaignRedeemCode).not.toHaveBeenCalled();
  });
});
