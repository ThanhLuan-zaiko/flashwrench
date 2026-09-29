import { mock } from "bun:test";
import type {
  CommentLookupRow,
  CommentRow,
} from "@/lib/comments/comment.types";
import type {
  OrderPartReviewRow,
  OrderReviewRow,
  RatingCounterRow,
  RescueReviewRow,
  ReviewProjectionRow,
  TargetReviewRow,
} from "@/lib/reviews/review.types";

// Shared repository stubs for the review/comment suites. Same pattern as
// parts.mocks.ts: tests mutate `feedbackStubs` and assert on mock.calls.
export const feedbackStubs = {
  orderReview: null as OrderReviewRow | null,
  orderPartReviews: [] as OrderPartReviewRow[],
  rescueReview: null as RescueReviewRow | null,
  orderClaimApplied: true,
  partClaimApplied: true,
  rescueClaimApplied: true,
  targetReviewPage: {
    rows: [] as TargetReviewRow[],
    pageState: null,
  } as { rows: TargetReviewRow[]; pageState: string | null },
  ratingCounter: null as RatingCounterRow | null,
  commentPage: {
    rows: [] as CommentRow[],
    pageState: null,
  } as { rows: CommentRow[]; pageState: string | null },
  replyPage: {
    rows: [] as CommentRow[],
    pageState: null,
  } as { rows: CommentRow[]; pageState: string | null },
  commentLookup: null as CommentLookupRow | null,
  topLevelLocation: null as CommentLookupRow | null,
  commentHidden: false,
  replyCount: 0,
  reviewProjection: null as ReviewProjectionRow | null,
  reviewProjectionScan: null as ReviewProjectionRow | null,
  reviewHidden: false,
};

export function makeOrderReviewRow(
  overrides?: Partial<OrderReviewRow>,
): OrderReviewRow {
  return {
    order_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    review_id: "12121212-1212-4121-8121-121212121212",
    customer_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    customer_name: "Nguyen Van A",
    rating: 5,
    body: "Giao nhanh, dong goi ky.",
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeRescueReviewRow(
  overrides?: Partial<RescueReviewRow>,
): RescueReviewRow {
  return {
    request_id: "abababab-abab-4bab-8bab-abababababab",
    review_id: "34343434-3434-4343-8343-343434343434",
    customer_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    mechanic_id: "56565656-5656-4565-8565-565656565656",
    customer_name: "Nguyen Van A",
    rating: 5,
    body: "Cuu ho den rat nhanh.",
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeTargetReviewRow(
  overrides?: Partial<TargetReviewRow>,
): TargetReviewRow {
  return {
    target_type: "part",
    target_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    review_id: "12121212-1212-4121-8121-121212121212",
    customer_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    customer_name: "Nguyen Van A",
    booking_id: null,
    order_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    rescue_id: null,
    rating: 5,
    title: null,
    body: "Hang tot, dung mo ta.",
    is_hidden: null,
    ...overrides,
  };
}

export function makeCommentRow(overrides?: Partial<CommentRow>): CommentRow {
  return {
    target_type: "part",
    target_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    comment_id: "78787878-7878-4787-8787-787878787878",
    user_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    user_name: "Nguyen Van A",
    user_role: "customer",
    body: "Binh luan thu nhat.",
    is_hidden: null,
    ...overrides,
  };
}

export function makeCommentLookupRow(
  overrides?: Partial<CommentLookupRow>,
): CommentLookupRow {
  return {
    comment_id: "78787878-7878-4787-8787-787878787878",
    target_type: "part",
    target_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    parent_id: null,
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeReviewProjectionRow(
  overrides?: Partial<ReviewProjectionRow>,
): ReviewProjectionRow {
  return {
    review_id: "12121212-1212-4121-8121-121212121212",
    target_type: "part",
    target_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    created_at: new Date("2026-01-06T00:00:00.000Z"),
    rating: 1,
    ...overrides,
  };
}

export const reviewRepoMocks = {
  findOrderReviewRow: mock(
    async (_orderId: string): Promise<OrderReviewRow | null> =>
      feedbackStubs.orderReview,
  ),
  listOrderPartReviewRows: mock(
    async (_orderId: string): Promise<OrderPartReviewRow[]> =>
      feedbackStubs.orderPartReviews,
  ),
  findRescueReviewRow: mock(
    async (_requestId: string): Promise<RescueReviewRow | null> =>
      feedbackStubs.rescueReview,
  ),
  claimOrderReview: mock(
    async (_write: unknown): Promise<boolean> =>
      feedbackStubs.orderClaimApplied,
  ),
  claimOrderPartReview: mock(
    async (_write: unknown): Promise<boolean> => feedbackStubs.partClaimApplied,
  ),
  claimRescueReview: mock(
    async (_write: unknown): Promise<boolean> =>
      feedbackStubs.rescueClaimApplied,
  ),
  projectTargetReview: mock(
    async (_write: unknown): Promise<void> => undefined,
  ),
  bumpRatingCounter: mock(
    async (
      _targetType: string,
      _targetId: string,
      _score: number,
      _countDelta?: number,
    ): Promise<void> => undefined,
  ),
  readRatingCounter: mock(
    async (
      _targetType: string,
      _targetId: string,
    ): Promise<RatingCounterRow | null> => feedbackStubs.ratingCounter,
  ),
  updatePartRating: mock(async (_params: unknown): Promise<void> => undefined),
  listTargetReviewRows: mock(
    async (
      _targetType: string,
      _targetId: string,
      _limit: number,
      _pageState: string | null,
    ): Promise<{ rows: TargetReviewRow[]; pageState: string | null }> =>
      feedbackStubs.targetReviewPage,
  ),
  findReviewProjection: mock(
    async (
      _reviewId: string,
      _targetType: string,
      _targetId: string,
    ): Promise<ReviewProjectionRow | null> => feedbackStubs.reviewProjection,
  ),
  findTargetReviewRowById: mock(
    async (
      _targetType: string,
      _targetId: string,
      _reviewId: string,
    ): Promise<ReviewProjectionRow | null> =>
      feedbackStubs.reviewProjectionScan,
  ),
  indexReviewProjection: mock(
    async (_row: ReviewProjectionRow): Promise<void> => undefined,
  ),
  readReviewHidden: mock(
    async (_projection: ReviewProjectionRow): Promise<boolean> =>
      feedbackStubs.reviewHidden,
  ),
  setTargetReviewHidden: mock(
    async (_params: unknown): Promise<void> => undefined,
  ),
};

export const commentRepoMocks = {
  insertComment: mock(async (_write: unknown): Promise<void> => undefined),
  insertReply: mock(async (_write: unknown): Promise<void> => undefined),
  listCommentRows: mock(
    async (
      _targetType: string,
      _targetId: string,
      _limit: number,
      _pageState: string | null,
    ): Promise<{ rows: CommentRow[]; pageState: string | null }> =>
      feedbackStubs.commentPage,
  ),
  listReplyRows: mock(
    async (
      _parentId: string,
      _limit: number,
      _pageState: string | null,
    ): Promise<{ rows: CommentRow[]; pageState: string | null }> =>
      feedbackStubs.replyPage,
  ),
  findCommentLookup: mock(
    async (_commentId: string): Promise<CommentLookupRow | null> =>
      feedbackStubs.commentLookup,
  ),
  findTopLevelLocation: mock(
    async (
      _targetType: string,
      _targetId: string,
      _commentId: string,
    ): Promise<CommentLookupRow | null> => feedbackStubs.topLevelLocation,
  ),
  indexCommentLookup: mock(
    async (_row: CommentLookupRow): Promise<void> => undefined,
  ),
  readCommentHidden: mock(
    async (_lookup: CommentLookupRow): Promise<boolean> =>
      feedbackStubs.commentHidden,
  ),
  readReplyCount: mock(
    async (_commentId: string): Promise<number> => feedbackStubs.replyCount,
  ),
  bumpReplyCount: mock(
    async (_commentId: string, _delta: number): Promise<void> => undefined,
  ),
  setCommentHidden: mock(async (_params: unknown): Promise<void> => undefined),
};

export function resetFeedbackMocks(): void {
  feedbackStubs.orderReview = null;
  feedbackStubs.orderPartReviews = [];
  feedbackStubs.rescueReview = null;
  feedbackStubs.orderClaimApplied = true;
  feedbackStubs.partClaimApplied = true;
  feedbackStubs.rescueClaimApplied = true;
  feedbackStubs.targetReviewPage = { rows: [], pageState: null };
  feedbackStubs.ratingCounter = null;
  feedbackStubs.commentPage = { rows: [], pageState: null };
  feedbackStubs.replyPage = { rows: [], pageState: null };
  feedbackStubs.commentLookup = null;
  feedbackStubs.topLevelLocation = null;
  feedbackStubs.commentHidden = false;
  feedbackStubs.replyCount = 0;
  feedbackStubs.reviewProjection = null;
  feedbackStubs.reviewProjectionScan = null;
  feedbackStubs.reviewHidden = false;
  for (const fn of Object.values(reviewRepoMocks)) fn.mockClear();
  for (const fn of Object.values(commentRepoMocks)) fn.mockClear();
}
