import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  domainPublishMocks,
  makeReviewBookingRow,
  resetWorkspaceMocks,
  reviewRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { createBookingReview } from "@/lib/booking/review.service";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

function completedBooking(overrides?: Parameters<typeof makeBookingRow>[0]) {
  return makeBookingRow({ status: "completed", ...overrides });
}

function reviewBody(overrides?: Record<string, unknown>) {
  return { rating: 5, body: "Tho den dung gio.", ...overrides };
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.bookingById = completedBooking();
});

describe("createBookingReview guards", () => {
  test("rejects invalid ratings, including truthy non-numbers", async () => {
    for (const rating of [true, 0, 6, 3.5, "five", null, [], {}]) {
      const result = await createBookingReview(
        customer,
        BOOKING_ID,
        reviewBody({ rating }),
      );
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });

  test("accepts a numeric-string rating", async () => {
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody({ rating: "4" }),
    );
    expect(result.ok).toBe(true);
  });

  test("rejects non-string or overlong bodies and non-record input", async () => {
    expect(await createBookingReview(customer, BOOKING_ID, null)).toMatchObject(
      { ok: false, status: 400 },
    );
    expect(
      await createBookingReview(
        customer,
        BOOKING_ID,
        reviewBody({ body: "x".repeat(1001) }),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });

  test("rejects foreign, incomplete and unassigned bookings", async () => {
    mechanicStubs.bookingById = completedBooking({ customer_id: OTHER_ID });
    expect(
      await createBookingReview(customer, BOOKING_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 404 });

    mechanicStubs.bookingById = completedBooking({ status: "in_progress" });
    expect(
      await createBookingReview(customer, BOOKING_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 400 });

    mechanicStubs.bookingById = completedBooking({ mechanic_id: null });
    expect(
      await createBookingReview(customer, BOOKING_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });
});

describe("createBookingReview claims and retries", () => {
  test("claims once, projects and publishes review-created", async () => {
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      bookingId: BOOKING_ID,
      mechanicId: MECHANIC_ID,
      rating: 5,
      body: "Tho den dung gio.",
    });
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(1);
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "review-created",
    );
  });

  test("same retry repairs projections and publishes with persisted fields", async () => {
    workspaceStubs.reviewClaimed = false;
    workspaceStubs.reviewByBooking = makeReviewBookingRow({
      customer_name: "Persisted Name",
      created_at: new Date("2026-09-16T10:00:00.000Z"),
    });
    workspaceStubs.reviewReadQueue = [null, workspaceStubs.reviewByBooking];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody(),
    );
    expect(result.ok).toBe(true);
    const write = reviewRepoMocks.projectBookingReview.mock.calls[0]?.[0];
    expect(write?.customerName).toBe("Persisted Name");
    expect(write?.createdAt).toEqual(new Date("2026-09-16T10:00:00.000Z"));
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("a conflicting existing review returns 409 without writing", async () => {
    workspaceStubs.reviewByBooking = makeReviewBookingRow({ rating: 4 });
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("a lost claim against different content is a conflict", async () => {
    workspaceStubs.reviewClaimed = false;
    workspaceStubs.reviewByBooking = makeReviewBookingRow({ rating: 1 });
    workspaceStubs.reviewReadQueue = [null, workspaceStubs.reviewByBooking];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(0);
  });

  test("a malformed persisted review is rejected, not repaired", async () => {
    workspaceStubs.reviewClaimed = false;
    workspaceStubs.reviewByBooking = makeReviewBookingRow({
      created_at: null as unknown as Date,
    });
    workspaceStubs.reviewReadQueue = [null, workspaceStubs.reviewByBooking];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(0);
  });
});
