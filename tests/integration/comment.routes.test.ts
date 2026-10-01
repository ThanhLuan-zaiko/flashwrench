import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser, postJsonRequest } from "../helpers/auth.fixtures";
import {
  authorizationMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

// Route-level coverage for the comment endpoints incl. replies and staff
// moderation. Services are stubbed; business rules live in the service
// suites (comments.service / comment-moderation tests).
const commentServiceMocks = {
  listComments: mock(
    async (_actor: unknown, _targetType: string, _targetId: string) => ({
      ok: true as const,
      data: { items: [], nextCursor: null },
    }),
  ),
  addComment: mock(
    async (
      _actor: unknown,
      _targetType: unknown,
      _targetId: unknown,
      _input: { parentId?: string },
    ) => ({
      ok: true as const,
      data: { id: "78787878-7878-4787-8787-787878787878" },
    }),
  ),
};

const commentRepliesServiceMocks = {
  listReplies: mock(
    async (_actor: unknown, _parentId: string, _cursor: string | null) => ({
      ok: true as const,
      data: { items: [], nextCursor: null },
    }),
  ),
};

const commentModerationMocks = {
  moderateComment: mock(
    async (
      _actor: unknown,
      _commentId: string,
      _body: { action?: string },
    ) => ({
      ok: true as const,
      data: { id: "78787878-7878-4787-8787-787878787878", hidden: true },
    }),
  ),
};

const reviewModerationMocks = {
  moderateReview: mock(
    async (
      _actor: unknown,
      _reviewId: string,
      _body: { targetType?: string },
    ) => ({
      ok: true as const,
      data: { id: "12121212-1212-4121-8121-121212121212", hidden: true },
    }),
  ),
};

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/comments/comments.service", () => commentServiceMocks);
mock.module(
  "@/lib/comments/comment-replies.service",
  () => commentRepliesServiceMocks,
);
mock.module(
  "@/lib/comments/comment-moderation.service",
  () => commentModerationMocks,
);
mock.module(
  "@/lib/reviews/review-moderation.service",
  () => reviewModerationMocks,
);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import * as commentModerationRoute from "@/app/api/comments/[commentId]/route";
import * as commentRoute from "@/app/api/comments/route";
import * as reviewModerationRoute from "@/app/api/reviews/[reviewId]/route";

const customer = makePublicUser({ role: "customer" });

beforeEach(() => {
  resetRouteMocks();
  for (const mocks of [
    commentServiceMocks,
    commentRepliesServiceMocks,
    commentModerationMocks,
    reviewModerationMocks,
  ]) {
    for (const fn of Object.values(mocks)) fn.mockClear();
  }
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

  test("GET ?parent pages replies through the replies service", async () => {
    const parentId = "78787878-7878-4787-8787-787878787878";
    const res = await commentRoute.GET(
      new Request(`http://localhost/api/comments?parent=${parentId}`),
    );
    expect(res.status).toBe(200);
    expect(commentRepliesServiceMocks.listReplies.mock.calls.length).toBe(1);
    expect(commentRepliesServiceMocks.listReplies.mock.calls[0]?.[1]).toBe(
      parentId,
    );
    expect(commentServiceMocks.listComments.mock.calls.length).toBe(0);
  });

  test("POST forwards parentId for replies", async () => {
    routeStubs.bookingUser = customer;
    const res = await commentRoute.POST(
      postJsonRequest("/api/comments", {
        targetType: "part",
        targetId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        body: "Tra loi",
        parentId: "78787878-7878-4787-8787-787878787878",
      }),
    );
    expect(res.status).toBe(201);
    const input = commentServiceMocks.addComment.mock.calls[0]?.[3] as {
      parentId?: string;
    };
    expect(input.parentId).toBe("78787878-7878-4787-8787-787878787878");
  });
});

describe("PATCH /api/comments/[commentId]", () => {
  const PARAMS = {
    params: Promise.resolve({
      commentId: "78787878-7878-4787-8787-787878787878",
    }),
  };
  const patch = (body: unknown) =>
    new Request("http://localhost/api/comments/x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  test("requires an admin or dispatcher session", async () => {
    expect(
      (await commentModerationRoute.PATCH(patch({ action: "hide" }), PARAMS))
        .status,
    ).toBe(401);
    routeStubs.bookingUser = customer;
    expect(
      (await commentModerationRoute.PATCH(patch({ action: "hide" }), PARAMS))
        .status,
    ).toBe(403);
    expect(commentModerationMocks.moderateComment.mock.calls.length).toBe(0);
  });

  test("dispatcher reaches the service with the comment id", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const res = await commentModerationRoute.PATCH(
      patch({ action: "hide" }),
      PARAMS,
    );
    expect(res.status).toBe(200);
    const call = commentModerationMocks.moderateComment.mock.calls[0];
    expect(call?.[1]).toBe("78787878-7878-4787-8787-787878787878");
    const payload = call?.[2] as { action: string } | undefined;
    expect(payload?.action).toBe("hide");
  });
});

describe("PATCH /api/reviews/[reviewId]", () => {
  const PARAMS = {
    params: Promise.resolve({
      reviewId: "12121212-1212-4121-8121-121212121212",
    }),
  };
  const patch = (body: unknown) =>
    new Request("http://localhost/api/reviews/x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const body = {
    action: "hide",
    targetType: "part",
    targetId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  };

  test("requires an admin or dispatcher session", async () => {
    expect(
      (await reviewModerationRoute.PATCH(patch(body), PARAMS)).status,
    ).toBe(401);
    routeStubs.bookingUser = makePublicUser({ role: "mechanic" });
    expect(
      (await reviewModerationRoute.PATCH(patch(body), PARAMS)).status,
    ).toBe(403);
    expect(reviewModerationMocks.moderateReview.mock.calls.length).toBe(0);
  });

  test("dispatcher reaches the service with review id + target", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "dispatcher" });
    const res = await reviewModerationRoute.PATCH(patch(body), PARAMS);
    expect(res.status).toBe(200);
    const call = reviewModerationMocks.moderateReview.mock.calls[0];
    expect(call?.[1]).toBe("12121212-1212-4121-8121-121212121212");
    expect(call?.[2]).toMatchObject({ targetType: "part" });
  });
});
