import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, postJsonRequest } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route-level coverage for the new customer-facing feedback endpoints.
// Services are stubbed; each test asserts auth ordering, input parsing
// and the response shape — business rules live in the service suites.
const complaintServiceMocks = {
  createCustomerComplaint: mock(async () => ({
    ok: true as const,
    data: { id: "c0mp1aint-1111-4111-8111-000000000000" },
  })),
  listMyComplaints: mock(async () => ({ ok: true as const, data: [] })),
};

const commentServiceMocks = {
  listComments: mock(
    async (_actor: unknown, _targetType: string, _targetId: string) => ({
      ok: true as const,
      data: { items: [], nextCursor: null },
    }),
  ),
  addComment: mock(async () => ({
    ok: true as const,
    data: { id: "78787878-7878-4787-8787-787878787878" },
  })),
};

const orderReviewServiceMocks = {
  createOrderReview: mock(async () => ({
    ok: true as const,
    data: { id: "r1" },
  })),
  createOrderPartReview: mock(
    async (_actor: unknown, _orderId: string, _partId: string) => ({
      ok: true as const,
      data: { id: "r2" },
    }),
  ),
  getOrderReviews: mock(async () => ({
    ok: true as const,
    data: { orderReview: null, partReviews: {} },
  })),
};

const rescueReviewServiceMocks = {
  createRescueReview: mock(async () => ({
    ok: true as const,
    data: { id: "r3" },
  })),
  getRescueReview: mock(async () => ({
    ok: true as const,
    data: { review: null },
  })),
};

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
  listPartReviews: mock(
    async (): Promise<TargetReviewResult> => ({
      ok: true,
      data: { items: [], nextCursor: null, ratingAvg: 4.5, ratingCount: 9 },
    }),
  ),
  listMechanicReviews: mock(
    async (): Promise<TargetReviewResult> => ({
      ok: true,
      data: { items: [], nextCursor: null, ratingAvg: 4.8, ratingCount: 3 },
    }),
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/complaints/complaints.service", () => complaintServiceMocks);
mock.module("@/lib/comments/comments.service", () => commentServiceMocks);
mock.module(
  "@/lib/reviews/order-review.service",
  () => orderReviewServiceMocks,
);
mock.module(
  "@/lib/reviews/rescue-review.service",
  () => rescueReviewServiceMocks,
);
mock.module(
  "@/lib/reviews/target-reviews.service",
  () => targetReviewServiceMocks,
);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import * as commentRoute from "@/app/api/comments/route";
import * as complaintRoute from "@/app/api/complaints/route";
import * as mechanicReviewsRoute from "@/app/api/mechanics/[mechanicId]/reviews/route";
import * as orderPartReviewRoute from "@/app/api/orders/[orderId]/reviews/[partId]/route";
import * as orderReviewsRoute from "@/app/api/orders/[orderId]/reviews/route";
import * as productReviewsRoute from "@/app/api/products/[slug]/reviews/route";
import * as rescueReviewRoute from "@/app/api/rescue/[requestId]/review/route";

const customer = makePublicUser({ role: "customer" });
const ORDER_PARAMS = {
  params: Promise.resolve({ orderId: "ffffffff-ffff-4fff-8fff-ffffffffffff" }),
};
const PART_PARAMS = {
  params: Promise.resolve({
    orderId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    partId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  }),
};
const RESCUE_PARAMS = {
  params: Promise.resolve({
    requestId: "abababab-abab-4bab-8bab-abababababab",
  }),
};

beforeEach(() => {
  resetRouteMocks();
  for (const mocks of [
    complaintServiceMocks,
    commentServiceMocks,
    orderReviewServiceMocks,
    rescueReviewServiceMocks,
    targetReviewServiceMocks,
  ]) {
    for (const fn of Object.values(mocks)) fn.mockClear();
  }
});

describe("GET/POST /api/complaints", () => {
  test("GET requires a session", async () => {
    const res = await complaintRoute.GET();
    expect(res.status).toBe(401);
    expect(complaintServiceMocks.listMyComplaints.mock.calls.length).toBe(0);
  });

  test("GET lists the signed-in customer's complaints", async () => {
    routeStubs.bookingUser = customer;
    const res = await complaintRoute.GET();
    expect(res.status).toBe(200);
    expect(complaintServiceMocks.listMyComplaints.mock.calls.length).toBe(1);
  });

  test("POST rejects unauthenticated callers and bad bodies", async () => {
    expect(
      (await complaintRoute.POST(postJsonRequest("/api/complaints", {})))
        .status,
    ).toBe(401);
    routeStubs.bookingUser = customer;
    const bad = new Request("http://localhost/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{oops",
    });
    expect((await complaintRoute.POST(bad)).status).toBe(400);
    expect(
      complaintServiceMocks.createCustomerComplaint.mock.calls.length,
    ).toBe(0);
  });

  test("POST creates the complaint and notifies the complaints topic", async () => {
    routeStubs.bookingUser = customer;
    const res = await complaintRoute.POST(
      postJsonRequest("/api/complaints", {
        subject: "Tho den tre",
        body: "Tho hen 9 gio nhung 11 gio moi den.",
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { complaint: { id: string } };
    expect(body.complaint.id).toBe("c0mp1aint-1111-4111-8111-000000000000");
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toContain("complaints");
  });
});

describe("GET/POST /api/comments", () => {
  test("GET accepts anonymous callers and forwards query params", async () => {
    const res = await commentRoute.GET(
      new Request(
        `http://localhost/api/comments?targetType=part&targetId=${"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(commentServiceMocks.listComments.mock.calls[0]?.[1]).toBe("part");
  });

  test("POST requires a session", async () => {
    const res = await commentRoute.POST(
      postJsonRequest("/api/comments", {
        targetType: "part",
        targetId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        body: "hi",
      }),
    );
    expect(res.status).toBe(401);
    expect(commentServiceMocks.addComment.mock.calls.length).toBe(0);
  });

  test("POST creates a comment for the signed-in user", async () => {
    routeStubs.bookingUser = customer;
    const res = await commentRoute.POST(
      postJsonRequest("/api/comments", {
        targetType: "part",
        targetId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        body: "Binh luan",
      }),
    );
    expect(res.status).toBe(201);
  });
});

describe("order review routes", () => {
  test("GET and POST require auth and hit the right service", async () => {
    expect(
      (
        await orderReviewsRoute.GET(
          new Request("http://localhost"),
          ORDER_PARAMS,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await orderReviewsRoute.POST(
          postJsonRequest("/api/orders/x/reviews", { rating: 5 }),
          ORDER_PARAMS,
        )
      ).status,
    ).toBe(401);

    routeStubs.bookingUser = customer;
    const get = await orderReviewsRoute.GET(
      new Request("http://localhost"),
      ORDER_PARAMS,
    );
    expect(get.status).toBe(200);
    const post = await orderReviewsRoute.POST(
      postJsonRequest("/api/orders/x/reviews", { rating: 5 }),
      ORDER_PARAMS,
    );
    expect(post.status).toBe(201);
    expect(orderReviewServiceMocks.createOrderReview.mock.calls.length).toBe(1);
  });

  test("part-level POST forwards the part id", async () => {
    routeStubs.bookingUser = customer;
    const res = await orderPartReviewRoute.POST(
      postJsonRequest("/api/orders/x/reviews/y", { rating: 4 }),
      PART_PARAMS,
    );
    expect(res.status).toBe(201);
    const call = orderReviewServiceMocks.createOrderPartReview.mock.calls[0];
    expect(call?.[2]).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  });
});

describe("rescue review routes", () => {
  test("GET and POST require auth", async () => {
    expect(
      (
        await rescueReviewRoute.GET(
          new Request("http://localhost"),
          RESCUE_PARAMS,
        )
      ).status,
    ).toBe(401);
    routeStubs.bookingUser = customer;
    expect(
      (
        await rescueReviewRoute.POST(
          postJsonRequest("/api/rescue/x/review", { rating: 5 }),
          RESCUE_PARAMS,
        )
      ).status,
    ).toBe(201);
  });
});

describe("public review routes", () => {
  test("product reviews work without a session", async () => {
    const res = await productReviewsRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "dau-nhot-10w-40" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reviews: { ratingAvg: number } };
    expect(body.reviews.ratingAvg).toBe(4.5);
  });

  test("mechanic reviews work without a session", async () => {
    const res = await mechanicReviewsRoute.GET(
      new Request("http://localhost"),
      {
        params: Promise.resolve({
          mechanicId: "56565656-5656-4565-8565-565656565656",
        }),
      },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reviews: { ratingCount: number } };
    expect(body.reviews.ratingCount).toBe(3);
  });

  test("service failures map to their status codes", async () => {
    targetReviewServiceMocks.listPartReviews.mockImplementationOnce(
      async () => ({
        ok: false as const,
        status: 404,
        errors: { form: "Không tìm thấy sản phẩm." },
      }),
    );
    const res = await productReviewsRoute.GET(new Request("http://localhost"), {
      params: Promise.resolve({ slug: "gone" }),
    });
    expect(res.status).toBe(404);
  });
});
