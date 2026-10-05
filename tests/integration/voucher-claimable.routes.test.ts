// Claimable-codes route: role guard, kind validation and error
// pass-through. The service is stubbed; the handler only shapes
// responses.
import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import type { VoucherResult } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";
import { makePublicUser, readJsonBody } from "../helpers/auth.fixtures";
import { authorizationMocks, routeStubs } from "../helpers/route-mocks";
import { VOUCHER_CAMPAIGN_ID } from "../helpers/voucher.fixtures";

const claimableStubs = {
  result: null as VoucherResult<ClaimableCodeCampaign[]> | null,
  throws: false,
};

const claimableServiceMocks = {
  listClaimableCodeCampaigns: mock(
    async (
      _userId: string,
      _kind: "booking" | "order" | null,
    ): Promise<VoucherResult<ClaimableCodeCampaign[]>> => {
      if (claimableStubs.throws) throw new Error("db down");
      return (
        claimableStubs.result ?? {
          ok: true,
          data: [
            {
              campaignId: VOUCHER_CAMPAIGN_ID,
              slug: "chao-mung",
              name: "Chao mung",
              code: "GIAM50K",
              discountType: "fixed",
              discountValue: 50000,
              maxDiscount: 0,
              minOrder: 0,
              endAt: null,
            },
          ],
        }
      );
    },
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module(
  "@/lib/vouchers/voucher-claimable.service",
  () => claimableServiceMocks,
);

import { GET } from "@/app/api/vouchers/claimable/route";

// Defensive cleanup: when several files share one `bun test` process,
// mock.module registrations can leak across files — restore the real
// service once these route tests are done.
afterAll(() => mock.restore());

const CUSTOMER = makePublicUser({ role: "customer" });

function get(url: string) {
  return GET(new NextRequest(`http://localhost${url}`));
}

beforeEach(() => {
  routeStubs.bookingUser = CUSTOMER;
  claimableStubs.result = null;
  claimableStubs.throws = false;
  claimableServiceMocks.listClaimableCodeCampaigns.mockClear();
});

describe("GET /api/vouchers/claimable", () => {
  test("anonymous and non-customer roles are rejected", async () => {
    routeStubs.bookingUser = null;
    expect((await get("/api/vouchers/claimable?kind=order")).status).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    expect((await get("/api/vouchers/claimable?kind=order")).status).toBe(403);
    expect(
      claimableServiceMocks.listClaimableCodeCampaigns,
    ).not.toHaveBeenCalled();
  });

  test("a missing kind lists every scope", async () => {
    const res = await get("/api/vouchers/claimable");
    expect(res.status).toBe(200);
    const call = claimableServiceMocks.listClaimableCodeCampaigns.mock.calls[0];
    expect(call?.[1]).toBeNull();
  });

  test("a bad kind still returns 400", async () => {
    expect((await get("/api/vouchers/claimable?kind=coupon")).status).toBe(400);
    expect(
      claimableServiceMocks.listClaimableCodeCampaigns,
    ).not.toHaveBeenCalled();
  });

  test("200 returns the items payload", async () => {
    const res = await get("/api/vouchers/claimable?kind=order");
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      items: [{ campaignId: VOUCHER_CAMPAIGN_ID, code: "GIAM50K" }],
    });
    const call = claimableServiceMocks.listClaimableCodeCampaigns.mock.calls[0];
    expect(call?.[0]).toBe(CUSTOMER.id);
    expect(call?.[1]).toBe("order");
  });

  test("a service throw surfaces 500", async () => {
    claimableStubs.throws = true;
    const res = await get("/api/vouchers/claimable?kind=booking");
    expect(res.status).toBe(500);
  });
});
