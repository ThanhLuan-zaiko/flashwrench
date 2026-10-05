// Voucher code routes: role guard, JSON parsing, both rate-limit axes
// and error pass-through. The service and limiter are stubbed.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { toWallet } from "@/lib/vouchers/voucher.mapper";
import type { VoucherResult } from "@/lib/vouchers/voucher.types";
import type {
  ClaimVoucherCodeResult,
  RedeemCodeVisibility,
} from "@/lib/vouchers/voucher-code.types";
import {
  makePublicUser,
  postJsonRequest,
  readJsonBody,
} from "../helpers/auth.fixtures";
import { authorizationMocks, routeStubs } from "../helpers/route-mocks";
import { makeWalletRow } from "../helpers/voucher.fixtures";

const codeStubs = {
  claimResult: null as VoucherResult<ClaimVoucherCodeResult> | null,
  viewerResult: null as VoucherResult<RedeemCodeVisibility> | null,
};

const codeServiceMocks = {
  claimWalletByCode: mock(
    async (_params: {
      userId: string;
      code: unknown;
      kind: string;
      subtotal: number;
    }): Promise<VoucherResult<ClaimVoucherCodeResult>> =>
      codeStubs.claimResult ?? {
        ok: true,
        data: {
          wallet: toWallet(makeWalletRow()),
          discount: 50000,
          reused: false,
        },
      },
  ),
  getRedeemCodeForViewer: mock(
    async (
      _userId: string,
      _slug: string,
      _now?: Date,
    ): Promise<VoucherResult<RedeemCodeVisibility>> =>
      codeStubs.viewerResult ?? {
        ok: true,
        data: { status: "claimable", code: "GIAM50K" },
      },
  ),
};

const rateLimitStubs = { allowed: true, buckets: [] as string[] };

const rateLimitMocks = {
  consumeRateLimit: mock(
    async (
      bucket: string,
      _limit: number,
      _windowMs: number,
    ): Promise<{ allowed: boolean; retryAfterSec: number }> => {
      rateLimitStubs.buckets.push(bucket);
      return { allowed: rateLimitStubs.allowed, retryAfterSec: 120 };
    },
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/vouchers/voucher-code.service", () => codeServiceMocks);
mock.module("@/lib/auth/rate-limit.repository", () => rateLimitMocks);

import { GET as campaignCodeGet } from "@/app/api/vouchers/campaign-code/[slug]/route";
import { POST as claimPost } from "@/app/api/vouchers/claim/route";

const CUSTOMER = makePublicUser({ role: "customer" });

function slugParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  routeStubs.bookingUser = CUSTOMER;
  codeStubs.claimResult = null;
  codeStubs.viewerResult = null;
  rateLimitStubs.allowed = true;
  rateLimitStubs.buckets = [];
  for (const fn of Object.values(codeServiceMocks)) fn.mockClear();
});

describe("POST /api/vouchers/claim", () => {
  const body = { code: "GIAM50K", kind: "order", subtotal: 200000 };

  test("anonymous and non-customer roles are rejected", async () => {
    routeStubs.bookingUser = null;
    expect(
      (await claimPost(postJsonRequest("/api/vouchers/claim", body))).status,
    ).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    expect(
      (await claimPost(postJsonRequest("/api/vouchers/claim", body))).status,
    ).toBe(403);
    expect(codeServiceMocks.claimWalletByCode).not.toHaveBeenCalled();
  });

  test("rejects a bad kind and broken JSON with 400", async () => {
    const badKind = await claimPost(
      postJsonRequest("/api/vouchers/claim", { ...body, kind: "coupon" }),
    );
    expect(badKind.status).toBe(400);
    const badJson = await claimPost(
      new Request("http://localhost/api/vouchers/claim", {
        method: "POST",
        body: "{oops",
      }),
    );
    expect(badJson.status).toBe(400);
    expect(codeServiceMocks.claimWalletByCode).not.toHaveBeenCalled();
  });

  test("a denied limiter answers 429 with Retry-After", async () => {
    rateLimitStubs.allowed = false;
    const res = await claimPost(postJsonRequest("/api/vouchers/claim", body));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(codeServiceMocks.claimWalletByCode).not.toHaveBeenCalled();
  });

  test("the per-account bucket carries the user id", async () => {
    await claimPost(postJsonRequest("/api/vouchers/claim", body));
    expect(
      rateLimitStubs.buckets.some(
        (bucket) =>
          bucket.startsWith("voucherCodeUser:user:") &&
          bucket.includes(CUSTOMER.id),
      ),
    ).toBe(true);
  });

  test("service errors pass through with their status", async () => {
    codeStubs.claimResult = {
      ok: false,
      status: 404,
      errors: { redeemCode: "Mã voucher không tồn tại hoặc đã hết hạn." },
    };
    const res = await claimPost(postJsonRequest("/api/vouchers/claim", body));
    expect(res.status).toBe(404);
    expect(await readJsonBody(res)).toMatchObject({
      errors: { redeemCode: "Mã voucher không tồn tại hoặc đã hết hạn." },
    });
  });

  test("200 returns the claimed wallet payload", async () => {
    const res = await claimPost(postJsonRequest("/api/vouchers/claim", body));
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      discount: 50000,
      reused: false,
    });
    expect(codeServiceMocks.claimWalletByCode.mock.calls[0]?.[0]).toMatchObject(
      { userId: CUSTOMER.id, code: "GIAM50K", kind: "order", subtotal: 200000 },
    );
  });
});

describe("GET /api/vouchers/campaign-code/[slug]", () => {
  test("anonymous and staff roles are rejected", async () => {
    routeStubs.bookingUser = null;
    expect(
      (await campaignCodeGet(new Request("http://localhost"), slugParams("x")))
        .status,
    ).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    expect(
      (await campaignCodeGet(new Request("http://localhost"), slugParams("x")))
        .status,
    ).toBe(403);
  });

  test("service errors pass through", async () => {
    codeStubs.viewerResult = {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy mã ưu đãi." },
    };
    const res = await campaignCodeGet(
      new Request("http://localhost"),
      slugParams("chao-mung"),
    );
    expect(res.status).toBe(404);
  });

  test("200 returns the visibility body", async () => {
    const res = await campaignCodeGet(
      new Request("http://localhost"),
      slugParams("chao-mung"),
    );
    expect(res.status).toBe(200);
    expect(await readJsonBody(res)).toMatchObject({
      status: "claimable",
      code: "GIAM50K",
    });
    const call = codeServiceMocks.getRedeemCodeForViewer.mock.calls[0];
    expect(call?.[0]).toBe(CUSTOMER.id);
    expect(call?.[1]).toBe("chao-mung");
  });
});
