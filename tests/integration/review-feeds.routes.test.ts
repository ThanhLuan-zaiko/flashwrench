import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route-level coverage for the review endpoints that feed the product page
// (buyer-only star rating gate) and the booking page (service reviews).
// Services are stubbed; business rules live in the service suites.
type TargetReviewResult =
  | {
      ok: true;
      data: {
        items: unknown[];
        nextCursor: null;
        ratingAvg: number;
        ratingCount: number;
      };
    }
  | { ok: false; status: number; errors: Record<string, string> };

const targetReviewServiceMocks = {
  listServiceReviews: mock(
    async (
      _serviceId: string,
      _cursor?: string | null,
    ): Promise<TargetReviewResult> => ({
      ok: true,
      data: { items: [], nextCursor: null, ratingAvg: 4.2, ratingCount: 6 },
    }),
  ),
};

type EligibilityResult =
  | { ok: true; data: { status: string; orderId?: string } }
  | { ok: false; status: number; errors: Record<string, string> };

const eligibilityServiceMocks = {
  getPartReviewEligibility: mock(
    async (_actor: unknown, _slug: string): Promise<EligibilityResult> => ({
      ok: true,
      data: { status: "eligible", orderId: "order-1" },
    }),
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module(
  "@/lib/reviews/target-reviews.service",
  () => targetReviewServiceMocks,
);
mock.module(
  "@/lib/reviews/part-review-eligibility.service",
  () => eligibilityServiceMocks,
);

import * as productEligibilityRoute from "@/app/api/products/[slug]/reviews/eligibility/route";
import * as serviceReviewsRoute from "@/app/api/services/[serviceId]/reviews/route";

const customer = makePublicUser({ role: "customer" });
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  resetRouteMocks();
  for (const mocks of [targetReviewServiceMocks, eligibilityServiceMocks]) {
    for (const fn of Object.values(mocks)) fn.mockClear();
  }
});

describe("GET /api/services/[serviceId]/reviews", () => {
  test("works without a session and forwards the cursor", async () => {
    const res = await serviceReviewsRoute.GET(
      new Request("http://localhost/api/services/x/reviews?cursor=abc"),
      { params: Promise.resolve({ serviceId: SERVICE_ID }) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      reviews: { ratingAvg: number; ratingCount: number };
    };
    expect(body.reviews).toMatchObject({ ratingAvg: 4.2, ratingCount: 6 });
    const call = targetReviewServiceMocks.listServiceReviews.mock.calls[0];
    expect(call?.[0]).toBe(SERVICE_ID);
    expect(call?.[1]).toBe("abc");
  });

  test("service failures map to their status codes", async () => {
    targetReviewServiceMocks.listServiceReviews.mockImplementationOnce(
      async () => ({
        ok: false as const,
        status: 400,
        errors: { form: "Mã dịch vụ không hợp lệ." },
      }),
    );
    const res = await serviceReviewsRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({ serviceId: "nope" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      errors: { form: "Mã dịch vụ không hợp lệ." },
    });
  });

  test("an unexpected failure answers 500 without leaking details", async () => {
    targetReviewServiceMocks.listServiceReviews.mockImplementationOnce(
      async () => {
        throw new Error("scylla down");
      },
    );
    const res = await serviceReviewsRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({ serviceId: SERVICE_ID }),
    });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("scylla");
  });
});

describe("GET /api/products/[slug]/reviews/eligibility", () => {
  const params = { params: Promise.resolve({ slug: "dau-nhot-10w-40" }) };

  test("requires a session before touching the service", async () => {
    const res = await productEligibilityRoute.GET(
      new Request("http://localhost"),
      params,
    );
    expect(res.status).toBe(401);
    expect(
      eligibilityServiceMocks.getPartReviewEligibility.mock.calls.length,
    ).toBe(0);
  });

  test("returns the eligibility for the signed-in customer", async () => {
    routeStubs.bookingUser = customer;
    const res = await productEligibilityRoute.GET(
      new Request("http://localhost"),
      params,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      eligibility: { status: string; orderId: string };
    };
    expect(body.eligibility).toEqual({
      status: "eligible",
      orderId: "order-1",
    });
    const call = eligibilityServiceMocks.getPartReviewEligibility.mock.calls[0];
    expect(call?.[1]).toBe("dau-nhot-10w-40");
  });

  test("service failures map to their status codes", async () => {
    routeStubs.bookingUser = customer;
    eligibilityServiceMocks.getPartReviewEligibility.mockImplementationOnce(
      async () => ({
        ok: false as const,
        status: 404,
        errors: { form: "Không tìm thấy sản phẩm." },
      }),
    );
    const res = await productEligibilityRoute.GET(
      new Request("http://localhost"),
      params,
    );
    expect(res.status).toBe(404);
  });

  test("an unexpected failure answers 500", async () => {
    routeStubs.bookingUser = customer;
    eligibilityServiceMocks.getPartReviewEligibility.mockImplementationOnce(
      async () => {
        throw new Error("scylla down");
      },
    );
    const res = await productEligibilityRoute.GET(
      new Request("http://localhost"),
      params,
    );
    expect(res.status).toBe(500);
  });
});
