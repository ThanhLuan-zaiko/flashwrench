import { describe, expect, test } from "bun:test";
import {
  LANDING_REVIEW_LIMIT,
  LANDING_SCAN_LIMIT,
  orderTargetLabel,
  pickLandingReviewRows,
  toLandingReview,
} from "@/lib/home/landing-reviews.service";
import type { TargetReviewRow } from "@/lib/reviews/review.types";

function makeRow(
  reviewId: string,
  overrides: Partial<TargetReviewRow> = {},
): TargetReviewRow {
  return {
    target_type: "mechanic",
    target_id: "m1",
    created_at: new Date("2026-09-20T10:00:00.000Z"),
    review_id: reviewId,
    customer_id: null,
    customer_name: "Khách A",
    booking_id: null,
    order_id: null,
    rescue_id: null,
    rating: 5,
    title: null,
    body: "Thợ làm việc rất tốt.",
    is_hidden: false,
    ...overrides,
  };
}

describe("pickLandingReviewRows", () => {
  test("drops hidden, low-rating and empty reviews", () => {
    const picked = pickLandingReviewRows([
      makeRow("hidden", { is_hidden: true }),
      makeRow("low", { rating: 3 }),
      makeRow("empty", { title: " ", body: null }),
      makeRow("good"),
    ]);
    expect(picked.map((row) => row.review_id)).toEqual(["good"]);
  });

  test("sorts newest first and dedupes multi-target projections", () => {
    const picked = pickLandingReviewRows([
      makeRow("older", { created_at: new Date("2026-09-10T10:00:00.000Z") }),
      makeRow("newer", {
        target_type: "service",
        target_id: "s1",
        created_at: new Date("2026-09-25T10:00:00.000Z"),
      }),
      makeRow("newer", {
        target_type: "mechanic",
        target_id: "m2",
        created_at: new Date("2026-09-25T10:00:00.000Z"),
      }),
    ]);
    expect(picked.map((row) => `${row.target_type}:${row.review_id}`)).toEqual([
      "service:newer",
      "mechanic:older",
    ]);
  });

  test("caps the pick at the requested limit", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      makeRow(`r${i}`, {
        created_at: new Date(`2026-09-${String(i + 1).padStart(2, "0")}`),
      }),
    );
    expect(pickLandingReviewRows(rows)).toHaveLength(LANDING_REVIEW_LIMIT);
    expect(pickLandingReviewRows(rows, 2)).toHaveLength(2);
  });

  test("scan budget stays comfortably above the card limit", () => {
    expect(LANDING_SCAN_LIMIT).toBeGreaterThanOrEqual(LANDING_REVIEW_LIMIT * 4);
  });
});

describe("toLandingReview", () => {
  test("joins title and body, falls back for missing customer names", () => {
    const review = toLandingReview(
      makeRow("r1", {
        title: "Nhanh",
        body: "Tới đúng hẹn",
        customer_name: " ",
      }),
      { kind: "service", name: "Thay nhớt tận nơi" },
    );
    expect(review.quote).toBe("Nhanh — Tới đúng hẹn");
    expect(review.customerName).toBe("Khách hàng");
    expect(review.targetKind).toBe("service");
    expect(review.targetName).toBe("Thay nhớt tận nơi");
    expect(review.createdAt).toBe("2026-09-20T10:00:00.000Z");
  });

  test("serializes a null timestamp to null", () => {
    const review = toLandingReview(makeRow("r2", { created_at: null }), {
      kind: "order",
      name: "#12345678",
    });
    expect(review.createdAt).toBeNull();
  });
});

describe("orderTargetLabel", () => {
  test("renders a short uppercase-free id fragment", () => {
    expect(orderTargetLabel("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(
      "#a1b2c3d4",
    );
  });
});
